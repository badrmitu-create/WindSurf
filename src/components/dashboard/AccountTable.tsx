"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Trash2 } from "lucide-react";
import type { Account, TableFilters } from "@/types";
import { formatDate, isUsedToday } from "@/lib/utils";

interface AccountTableProps {
  accounts: Account[];
  onDelete?: (id: number) => void;
}

export function AccountTable({ accounts, onDelete }: AccountTableProps) {
  const [filters, setFilters] = useState<TableFilters>({
    search: "",
    status: "all",
    sortField: "created_at",
    sortDirection: "desc",
  });

  const filteredAccounts = accounts
    .filter((account) => {
      const matchesSearch =
        account.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        `${account.first_name} ${account.last_name}`
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchesStatus =
        filters.status === "all" ||
        (filters.status === "used" && isUsedToday(account.last_used_at)) ||
        (filters.status === "unused" && !isUsedToday(account.last_used_at));

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const modifier = filters.sortDirection === "asc" ? 1 : -1;
      
      if (filters.sortField === "status") {
        const aUsed = isUsedToday(a.last_used_at);
        const bUsed = isUsedToday(b.last_used_at);
        return (aUsed === bUsed ? 0 : aUsed ? 1 : -1) * modifier;
      }
      
      return (
        (a[filters.sortField] > b[filters.sortField] ? 1 : -1) * modifier
      );
    });

  const handleSort = (field: TableFilters["sortField"]) => {
    setFilters((prev) => ({
      ...prev,
      sortField: field,
      sortDirection:
        prev.sortField === field && prev.sortDirection === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Registered Accounts</CardTitle>
          <div className="flex items-center gap-2">
              <Input
                placeholder="Search accounts..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                icon={<Search className="w-4 h-4" />}
                className="w-64"
              />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as TableFilters["status"],
                }))
              }
              className="input-field w-32 [&>option]:bg-zinc-900 [&>option]:text-zinc-100"
            >
              <option value="all">All</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto overflow-y-auto scrollbar-themed flex-1 min-h-0">
          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10">
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200" onClick={() => handleSort("email")}>
                  Email {filters.sortField === "email" && (filters.sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200" onClick={() => handleSort("created_at")}>
                  Created {filters.sortField === "created_at" && (filters.sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200" onClick={() => handleSort("last_used_at")}>
                  Last Used {filters.sortField === "last_used_at" && (filters.sortDirection === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-500">
                    No accounts found
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-zinc-200">
                          {account.email}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {account.first_name} {account.last_name}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-400">
                      {formatDate(account.created_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-400">
                      {account.last_used_at === "2000-01-01"
                        ? "Never"
                        : formatDate(account.last_used_at)}
                    </td>
                    <td className="py-3 px-4">
                      {isUsedToday(account.last_used_at) ? (
                        <Badge variant="warning">Used</Badge>
                      ) : (
                        <Badge variant="success">Unused</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-zinc-500">
          Showing {filteredAccounts.length} of {accounts.length} accounts
        </div>
      </CardContent>
    </Card>
  );
}
