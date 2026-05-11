"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Users, Database, Clock, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@/types";

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Total Accounts",
      value: stats.totalAccounts,
      icon: Users,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      title: "Unused",
      value: stats.unusedToday,
      icon: Database,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Used",
      value: stats.usedToday,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Available",
      value: stats.totalAccounts > 0 ? `${((stats.unusedToday / stats.totalAccounts) * 100).toFixed(0)}%` : "0%",
      icon: TrendingUp,
      color: "text-info",
      bg: "bg-info/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-32 h-32 ${card.bg} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity`} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
