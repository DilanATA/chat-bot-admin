// app/api/migrate/route.ts
import { NextResponse } from "next/server";
import { openDb, migrate } from "@/lib/migrate";

export async function GET() {
  try {
    const db = openDb();
    migrate(db);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
