import Database from "better-sqlite3";
import path from "path";
import type { Account } from "@/types";

const DB_PATH = path.join(process.cwd(), "windsurf.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT DEFAULT '2000-01-01'
    )
  `);
}

export function saveAccount(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): boolean {
  const database = getDb();
  try {
    const stmt = database.prepare(
      "INSERT INTO accounts (email, password, first_name, last_name) VALUES (?, ?, ?, ?)"
    );
    stmt.run(email, password, firstName, lastName);
    return true;
  } catch {
    return false;
  }
}

export function getAllAccounts(): Account[] {
  const database = getDb();
  const stmt = database.prepare("SELECT * FROM accounts ORDER BY created_at DESC");
  return stmt.all() as Account[];
}

export function getUnusedAccount(): string | null {
  const database = getDb();
  const today = new Date().toISOString().split("T")[0];
  const stmt = database.prepare(
    "SELECT email FROM accounts WHERE last_used_at != ? OR last_used_at IS NULL LIMIT 1"
  );
  const result = stmt.get(today) as { email: string } | undefined;
  if (result) {
    const updateStmt = database.prepare(
      "UPDATE accounts SET last_used_at = ? WHERE email = ?"
    );
    updateStmt.run(today, result.email);
    return result.email;
  }
  return null;
}

export function deleteAccount(id: number): boolean {
  const database = getDb();
  try {
    const stmt = database.prepare("DELETE FROM accounts WHERE id = ?");
    stmt.run(id);
    return true;
  } catch {
    return false;
  }
}

export function getAccountStats(): {
  total: number;
  usedToday: number;
  unusedToday: number;
} {
  const database = getDb();
  const today = new Date().toISOString().split("T")[0];

  const total = (
    database.prepare("SELECT COUNT(*) as count FROM accounts").get() as {
      count: number;
    }
  ).count;

  const usedToday = (
    database
      .prepare("SELECT COUNT(*) as count FROM accounts WHERE last_used_at = ?")
      .get(today) as { count: number }
  ).count;

  return {
    total,
    usedToday,
    unusedToday: total - usedToday,
  };
}
