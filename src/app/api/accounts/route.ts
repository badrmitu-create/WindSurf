import { NextResponse } from "next/server";
import {
  getAllAccounts,
  getAccountStats,
  deleteAccount,
  saveAccount,
} from "@/lib/db";

export async function GET() {
  try {
    const accounts = getAllAccounts();
    const stats = getAccountStats();
    return NextResponse.json({ accounts, stats });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, first_name, last_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const success = saveAccount(email, password, first_name, last_name);
    if (!success) {
      return NextResponse.json(
        { error: "Account already exists or save failed" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 }
      );
    }

    const success = deleteAccount(parseInt(id));
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
