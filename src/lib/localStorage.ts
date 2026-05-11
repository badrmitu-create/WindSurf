import type { Account, DashboardStats } from "@/types";

const STORAGE_KEY = "windsurf_accounts";

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveAccount(account: Omit<Account, "id" | "created_at" | "last_used_at">): Account {
  const accounts = getAccounts();
  const newAccount: Account = {
    id: Date.now(),
    email: account.email,
    password: account.password,
    first_name: account.first_name,
    last_name: account.last_name,
    created_at: new Date().toISOString(),
    last_used_at: "2000-01-01",
  };
  accounts.unshift(newAccount);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return newAccount;
}

export function deleteAccount(id: number): boolean {
  const accounts = getAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  if (filtered.length === accounts.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function markAccountUsed(id: number): Account | null {
  const accounts = getAccounts();
  const account = accounts.find((a) => a.id === id);
  if (!account) return null;
  account.last_used_at = new Date().toISOString().split("T")[0];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return account;
}

export function getUnusedAccount(): Account | null {
  const accounts = getAccounts();
  const today = new Date().toISOString().split("T")[0];
  const unused = accounts.find((a) => a.last_used_at !== today);
  if (!unused) return null;
  markAccountUsed(unused.id);
  return unused;
}

export function getStats(): DashboardStats {
  const accounts = getAccounts();
  const today = new Date().toISOString().split("T")[0];
  const usedToday = accounts.filter((a) => a.last_used_at === today).length;
  const unusedToday = accounts.length - usedToday;
  return {
    totalAccounts: accounts.length,
    unusedToday,
    usedToday,
    successRate:
      accounts.length > 0
        ? ((accounts.length - usedToday) / accounts.length) * 100
        : 0,
  };
}
