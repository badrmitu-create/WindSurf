import { NextResponse } from "next/server";
import { getAccountStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = getAccountStats();
    return NextResponse.json({
      totalAccounts: stats.total,
      usedToday: stats.usedToday,
      unusedToday: stats.unusedToday,
      successRate: stats.total > 0 ? ((stats.total - stats.usedToday) / stats.total) * 100 : 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
