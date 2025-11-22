// app/api/message-logs/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");
  const status = searchParams.get("status");
  const limit = Number(searchParams.get("limit") || 100);

  let sql = "SELECT * FROM message_logs WHERE 1=1";
  const args: any[] = [];
  if (tenant) { sql += " AND tenant=?"; args.push(tenant); }
  if (status) { sql += " AND status=?"; args.push(status); }
  sql += " ORDER BY id DESC LIMIT ?"; args.push(limit);

  const rows = db.prepare(sql).all(...args);
  return NextResponse.json({ ok: true, data: rows });
}
