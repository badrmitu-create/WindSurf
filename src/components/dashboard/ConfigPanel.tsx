"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { Settings, Cpu, Eye, Shield, Hash } from "lucide-react";
import type { AutomationConfig } from "@/types";

interface ConfigPanelProps {
  config: AutomationConfig;
  onChange: (config: Partial<AutomationConfig>) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">
            Number of Accounts
          </label>
          <Input
            type="number"
            min="1"
            max="100"
            value={config.accountCount}
            onChange={(e) =>
              onChange({ ...config, accountCount: parseInt(e.target.value) })
            }
            icon={<Hash className="w-4 h-4" />}
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            Number of accounts to create in this batch
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              First Name
            </label>
            <Input
              value={config.firstName}
              onChange={(e) => onChange({ firstName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Last Name
            </label>
            <Input
              value={config.lastName}
              onChange={(e) => onChange({ lastName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => onChange({ password: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-zinc-800">
          <Toggle
            enabled={config.headless}
            onChange={(enabled) => onChange({ headless: enabled })}
            label="Headless Mode"
            description="Run browser automation without UI"
          />

          <Toggle
            enabled={config.autoVerify}
            onChange={(enabled) => onChange({ autoVerify: enabled })}
            label="Auto Verify"
            description="Automatically verify email codes"
          />
        </div>
      </CardContent>
    </Card>
  );
}
