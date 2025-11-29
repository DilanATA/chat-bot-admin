// app/api/message-logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant") ?? "DEFAULT";
    const db = openDb();

    const logs = db
      .prepare(
        `SELECT id, tenant, to_phone, result, created_at 
         FROM message_logs 
         WHERE tenant = ? 
         ORDER BY id DESC 
         LIMIT 20`
      )
      .all(tenant);

    return NextResponse.json({ ok: true, data: logs });
  } catch (err) {
    console.error("❌ [GET /message-logs] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
