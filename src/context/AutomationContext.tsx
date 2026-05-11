"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type {
  AutomationConfig,
  LogEntry,
  AutomationStatus,
  Account,
} from "@/types";

interface AutomationContextType {
  config: AutomationConfig;
  setConfig: (config: Partial<AutomationConfig>) => void;
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
  status: AutomationStatus;
  setStatus: (status: Partial<AutomationStatus>) => void;
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
}

const AutomationContext = createContext<AutomationContextType | null>(null);

const defaultConfig: AutomationConfig = {
  accountCount: 5,
  concurrency: 10,
  firstName: "Yousef",
  lastName: "Sayed",
  password: "Yousef231",
  headless: true,
  autoVerify: true,
};

const defaultStatus: AutomationStatus = {
  isRunning: false,
  totalAccounts: 0,
  completedAccounts: 0,
  failedAccounts: 0,
  currentChunk: 0,
  totalChunks: 0,
};

export function AutomationProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<AutomationConfig>(defaultConfig);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [status, setStatusState] = useState<AutomationStatus>(defaultStatus);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const setConfig = useCallback(
    (newConfig: Partial<AutomationConfig>) => {
      setConfigState((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  const addLog = useCallback(
    (log: Omit<LogEntry, "id" | "timestamp">) => {
      const newLog: LogEntry = {
        ...log,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };
      setLogs((prev) => [...prev, newLog]);
    },
    []
  );

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const setStatus = useCallback(
    (newStatus: Partial<AutomationStatus>) => {
      setStatusState((prev) => ({ ...prev, ...newStatus }));
    },
    []
  );

  return (
    <AutomationContext.Provider
      value={{
        config,
        setConfig,
        logs,
        addLog,
        clearLogs,
        status,
        setStatus,
        accounts,
        setAccounts,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
}

export function useAutomation() {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error("useAutomation must be used within AutomationProvider");
  }
  return context;
}
