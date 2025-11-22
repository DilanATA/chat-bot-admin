// app/api/webhook/whatsapp/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // MVP: payload içinden normalize et
  const { tenant, phone, message_id, status, timestamp } = payload || {};
  if (!tenant || !message_id || !status) {
    return NextResponse.json({ ok: false, error: "tenant, message_id, status required" }, { status: 400 });
    }

  db.prepare(
    "INSERT INTO message_logs (tenant, phone, message_id, status, timestamp) VALUES (?, ?, ?, ?, ?)"
  ).run(tenant, phone || null, message_id, status, Number(timestamp || Date.now()));

  logAudit(tenant, "webhook.message_status", { phone, message_id, status });
  return NextResponse.json({ ok: true });
}
