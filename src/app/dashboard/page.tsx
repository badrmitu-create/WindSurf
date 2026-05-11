"use client";

import React, { useEffect, useState } from "react";
import { useAutomation } from "@/context/AutomationContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AccountTable } from "@/components/dashboard/AccountTable";
import { ActivityMonitor } from "@/components/dashboard/ActivityMonitor";
import { Button } from "@/components/ui/Button";
import { Play, Copy, RefreshCw } from "lucide-react";
import type { DashboardStats } from "@/types";
import {
  getStats as getStoredStats,
  deleteAccount as deleteStoredAccount,
  getUnusedAccount as getStoredUnusedAccount,
  saveAccount as saveStoredAccount,
} from "@/lib/localStorage";

export default function DashboardPage() {
  const {
    config,
    logs,
    addLog,
    clearLogs,
    status,
    setStatus,
    accounts,
    refreshAccounts,
  } = useAutomation();

  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    unusedToday: 0,
    usedToday: 0,
    successRate: 0,
  });
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const refreshData = () => {
    refreshAccounts();
    setStats(getStoredStats());
  };

  useEffect(() => {
    refreshData();
    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Update stats whenever accounts change
  useEffect(() => {
    setStats(getStoredStats());
  }, [accounts]);

  const connectLogStream = () => {
    const es = new EventSource("/api/automation/logs");
    es.onmessage = (event) => {
      const log = JSON.parse(event.data);
      addLog({
        level: log.level,
        message: log.message,
      });
    };
    es.onerror = () => {
      es.close();
      setEventSource(null);
    };
    setEventSource(es);
    return es;
  };

  const startAutomation = async () => {
    if (status.isRunning) return;

    setStatus({ isRunning: true });
    const es = connectLogStream();

    try {
      const response = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.success && data.results) {
        // Save successful accounts to localStorage
        data.results.forEach((result: any) => {
          if (result.success) {
            saveStoredAccount({
              email: result.email,
              password: config.password,
              first_name: config.firstName,
              last_name: config.lastName,
            });
          }
        });
        refreshData();
      }
    } catch (error) {
      addLog({ level: "error", message: "Automation request failed" });
    } finally {
      es.close();
      setEventSource(null);
      setStatus({ isRunning: false });
    }
  };

  const getUnusedAccount = async () => {
    try {
      const account = getStoredUnusedAccount();
      if (account) {
        await navigator.clipboard.writeText(account.email);
        addLog({ level: "success", message: `Copied: ${account.email}` });
        refreshData();
      } else {
        addLog({ level: "warning", message: "No unused accounts available" });
      }
    } catch (error) {
      addLog({ level: "error", message: "Failed to get unused account" });
    }
  };

  const handleDeleteAccount = (id: number) => {
    const deleted = deleteStoredAccount(id);
    if (deleted) {
      addLog({ level: "info", message: "Account deleted" });
      refreshData();
    } else {
      addLog({ level: "error", message: "Failed to delete account" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 bg-zinc-950 overflow-hidden">
        <div className="p-6 h-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
              <p className="text-zinc-400">Manage your automated accounts</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={getUnusedAccount}>
                <Copy className="w-4 h-4" />
                Get Unused
              </Button>
              <Button variant="secondary" onClick={refreshData}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button
                onClick={startAutomation}
                loading={status.isRunning}
                disabled={status.isRunning}
              >
                <Play className="w-4 h-4" />
                {status.isRunning ? "Running..." : "Start Automation"}
              </Button>
            </div>
          </div>

          <StatsCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            <div className="lg:col-span-2 min-h-0">
              <AccountTable accounts={accounts} onDelete={handleDeleteAccount} />
            </div>
            <div className="min-h-0">
              <ActivityMonitor logs={logs} onClear={clearLogs} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
