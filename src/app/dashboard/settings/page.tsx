"use client";

import React from "react";
import { useAutomation } from "@/context/AutomationContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ConfigPanel } from "@/components/dashboard/ConfigPanel";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Settings, Database, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  const { config, setConfig } = useAutomation();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 bg-zinc-950">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
            <p className="text-zinc-400">Configure your automation preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConfigPanel config={config} onChange={setConfig} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent" />
                  Database Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  enabled={true}
                  onChange={() => {}}
                  label="Auto-create Table"
                  description="Automatically create database tables on startup"
                />
                <Toggle
                  enabled={true}
                  onChange={() => {}}
                  label="WAL Mode"
                  description="Write-Ahead Logging for better concurrent performance"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  Mail.tm Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  enabled={true}
                  onChange={() => {}}
                  label="Auto-retry on Failure"
                  description="Retry mail.tm account creation on failure (3 attempts)"
                />
                <Toggle
                  enabled={true}
                  onChange={() => {}}
                  label="Verify Email"
                  description="Wait for and submit verification codes automatically"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-accent" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Toggle
                  enabled={true}
                  onChange={() => {}}
                  label="Activity Logs"
                  description="Show real-time activity logs in the dashboard"
                />
                <Toggle
                  enabled={false}
                  onChange={() => {}}
                  label="Sound Notifications"
                  description="Play a sound when automation completes"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
