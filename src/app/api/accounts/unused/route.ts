import { NextResponse } from "next/server";
import { getUnusedAccount } from "@/lib/db";

export async function GET() {
  try {
    const email = getUnusedAccount();
    if (email) {
      return NextResponse.json({ email });
    }
    return NextResponse.json(
      { error: "No unused accounts available for today" },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch unused account" },
      { status: 500 }
    );
  }
}
