import { NextResponse } from "next/server";
import { chromium } from "playwright";
import { notifyClients, notifyAccountCreated } from "@/lib/sse";

interface AutomationRequest {
  accountCount: number;
  concurrency: number;
  firstName: string;
  lastName: string;
  password: string;
  headless: boolean;
  autoVerify: boolean;
}

const DEFAULT_CONCURRENCY = 1;

const MAIL_TM_API = "https://api.mail.tm";

function generateUsername(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generatePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createMailTmAccount(): Promise<{
  email: string;
  password: string;
} | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const domainResp = await fetch(`${MAIL_TM_API}/domains`);
      const domainData = await domainResp.json();
      const domain = domainData["hydra:member"]?.[0]?.domain;
      if (!domain) continue;

      const username = generateUsername();
      const email = `${username}@${domain}`;
      const password = generatePassword();

      const resp = await fetch(`${MAIL_TM_API}/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: email, password }),
      });

      if (resp.status === 201) {
        return { email, password };
      }
    } catch {
      // Retry on failure
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function getMailTmToken(
  email: string,
  password: string
): Promise<string | null> {
  try {
    const resp = await fetch(`${MAIL_TM_API}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: email, password }),
    });
    if (resp.status === 200) {
      const data = await resp.json();
      return data.token;
    }
  } catch {}
  return null;
}

async function waitForVerificationCode(
  token: string,
  timeoutMs: number = 120000
): Promise<string | null> {
  const headers = { Authorization: `Bearer ${token}` };
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const resp = await fetch(`${MAIL_TM_API}/messages`, { headers });
      if (resp.status === 200) {
        const data = await resp.json();
        const messages = data["hydra:member"] || [];
        for (const m of messages) {
          const detailResp = await fetch(`${MAIL_TM_API}/messages/${m.id}`, {
            headers,
          });
          const detail = await detailResp.json();
          const content = detail.text || "";
          const match = content.match(/\b\d{6}\b/);
          if (match) {
            return match[0];
          }
        }
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 5000));
  }
  return null;
}

async function registerWindsurfAccount(
  email: string,
  mailPassword: string,
  config: AutomationRequest
): Promise<{ success: boolean; error?: string }> {
  let browser;
  try {
    browser = await chromium.launch({
      headless: config.headless,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    // Navigate to registration page
    notifyClients(`Registering: ${email.slice(0, 15)}...`, "info");
    await page.goto("https://windsurf.com/account/register", {
      timeout: 60000,
      waitUntil: "domcontentloaded",
    });

    // --- PAGE 1: Registration form ---
    await page.waitForSelector('input[autocomplete="given-name"]', {
      timeout: 10000,
    });
    await page.fill('input[autocomplete="given-name"]', config.firstName);
    await page.fill('input[autocomplete="family-name"]', config.lastName);
    await page.fill('input[name="email"]', email);

    // Check TOS checkbox if present
    try {
      const checkbox = await page.$('input#auth1-agree-tos');
      if (checkbox && !(await checkbox.isChecked())) {
        await checkbox.check();
      }
    } catch {}

    await page.click('button[type="submit"]');

    // --- PAGE 2: Password ---
    // Wait for either the password page or an error on the current page
    const passwordResult = await Promise.race([
      page.waitForSelector('input[name="password"]', { timeout: 30000 })
        .then(() => 'password_page' as const),
      page.waitForSelector('[role="alert"], .error, .alert, [data-error]', { timeout: 30000 })
        .then(() => 'error' as const),
      new Promise<'timeout'>(r => setTimeout(() => r('timeout'), 30000)),
    ]);

    if (passwordResult !== 'password_page') {
      const errorText = passwordResult === 'error'
        ? await page.locator('[role="alert"], .error, .alert, [data-error]').first().textContent().catch(() => 'Unknown error')
        : 'Password page did not load in time';
      notifyClients(`Registration failed at password step: ${errorText}`, "error");
      return { success: false, error: errorText || undefined };
    }

    await page.fill('input[name="password"]', config.password);
    await page.fill('input[name="confirmPassword"]', config.password);
    await page.click('button[type="submit"]');

    // --- PAGE 3: Email verification ---
    if (config.autoVerify) {
      notifyClients(`Waiting for verification code: ${email.slice(0, 15)}...`, "info");
      const token = await getMailTmToken(email, mailPassword);
      if (!token) {
        notifyClients(`Failed to get Mail.tm token: ${email}`, "error");
        return { success: false, error: "Failed to get Mail.tm token" };
      }

      const code = await waitForVerificationCode(token);
      if (!code) {
        notifyClients(`Verification code not received: ${email}`, "error");
        return { success: false, error: "Verification code not received" };
      }

      notifyClients(`Code received: ${code} for ${email.slice(0, 15)}...`, "success");

      // Try individual digit inputs first (6 separate inputs)
      const digitInputs = await page.$$('input[maxlength="1"]');
      if (digitInputs.length >= 6) {
        for (let i = 0; i < 6; i++) {
          await digitInputs[i].fill(code[i]);
          await new Promise((r) => setTimeout(r, 100));
        }
      } else {
        // Fallback: single OTP input
        try {
          await page.waitForSelector(
            'input[autocomplete="one-time-code"]',
            { timeout: 5000 }
          );
          await page.focus('input[autocomplete="one-time-code"]');
          await page.keyboard.type(code, { delay: 100 });
        } catch {
          return {
            success: false,
            error: "Could not find verification input",
          };
        }
      }

      await page.keyboard.press("Enter");
      await new Promise((r) => setTimeout(r, 5000));
    }

    notifyAccountCreated(email, config.password, config.firstName, config.lastName);
    return { success: true };
  } catch (error: any) {
    notifyClients(`Registration failed: ${error.message || "Unknown error"}`, "error");
    return {
      success: false,
      error: error.message || "Registration flow failed",
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: Request) {
  try {
    const config: AutomationRequest = await request.json();

    if (!config.accountCount || config.accountCount < 1) {
      return NextResponse.json(
        { error: "Account count must be at least 1" },
        { status: 400 }
      );
    }

    const results: {
      email: string;
      success: boolean;
      error?: string;
    }[] = [];

    const totalChunks = Math.ceil(config.accountCount / DEFAULT_CONCURRENCY);

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      const chunkSize = Math.min(
        DEFAULT_CONCURRENCY,
        config.accountCount - chunk * DEFAULT_CONCURRENCY
      );

      const chunkPromises = Array.from({ length: chunkSize }, async () => {
        // Stagger requests slightly
        await new Promise((r) =>
          setTimeout(r, Math.random() * 1000 + 500)
        );

        const mailAccount = await createMailTmAccount();
        if (!mailAccount) {
          notifyClients("Mail.tm account creation failed", "error");
          return {
            email: "failed",
            success: false,
            error: "Mail.tm account creation failed",
          };
        }

        notifyClients(`Email created: ${mailAccount.email}`, "info");

        const result = await registerWindsurfAccount(
          mailAccount.email,
          mailAccount.password,
          config
        );

        return {
          email: mailAccount.email,
          ...result,
        };
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      if (chunk < totalChunks - 1) {
        const hasFailures = chunkResults.some((r) => !r.success);
        await new Promise((r) =>
          setTimeout(r, hasFailures ? 15000 : 5000)
        );
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    notifyClients(
      `Automation complete: ${successCount} succeeded, ${failCount} failed`,
      successCount > 0 ? "success" : "error"
    );

    return NextResponse.json({
      success: true,
      total: results.length,
      succeeded: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Automation request failed" },
      { status: 500 }
    );
  }
}
