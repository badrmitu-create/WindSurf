"use client";

import React, { useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import type { LogEntry } from "@/types";

interface ActivityMonitorProps {
  logs: LogEntry[];
  onClear: () => void;
}

export function ActivityMonitor({ logs, onClear }: ActivityMonitorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: LogEntry["level"]) => {
    const colors = {
      info: "text-info",
      success: "text-success",
      warning: "text-warning",
      error: "text-danger",
      system: "text-zinc-500",
    };
    return colors[level];
  };

  const getLevelPrefix = (level: LogEntry["level"]) => {
    const prefixes = {
      info: "[INFO]",
      success: "[SUCCESS]",
      warning: "[WARN]",
      error: "[ERROR]",
      system: "[SYSTEM]",
    };
    return prefixes[level];
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Monitor</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-themed bg-zinc-950 rounded-lg p-4 font-mono text-sm space-y-1 border border-zinc-800"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-600 text-center py-8">
              No activity logs yet...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="terminal-line">
                <span className="text-zinc-600">{log.timestamp}</span>{" "}
                <span className={getLevelColor(log.level)}>
                  {getLevelPrefix(log.level)}
                </span>{" "}
                <span className="text-zinc-300">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
