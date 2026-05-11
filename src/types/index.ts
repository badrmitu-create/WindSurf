export interface Account {
  id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  created_at: string;
  last_used_at: string;
}

export interface AutomationConfig {
  accountCount: number;
  concurrency: number;
  firstName: string;
  lastName: string;
  password: string;
  headless: boolean;
  autoVerify: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error" | "system";
  message: string;
}

export interface AutomationStatus {
  isRunning: boolean;
  totalAccounts: number;
  completedAccounts: number;
  failedAccounts: number;
  currentChunk: number;
  totalChunks: number;
}

export interface DashboardStats {
  totalAccounts: number;
  unusedToday: number;
  usedToday: number;
  successRate: number;
}

export type SortDirection = "asc" | "desc";
export type SortField = "email" | "created_at" | "last_used_at" | "status";

export interface TableFilters {
  search: string;
  status: "all" | "used" | "unused";
  sortField: SortField;
  sortDirection: SortDirection;
}
