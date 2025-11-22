// app/api/stats/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Bugünün zaman aralığı (lokal)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const t0 = start.getTime();
    const t1 = end.getTime();

    // message_logs: delivered/read/failed sayıları
    const rows = db
      .prepare(
        `SELECT status, COUNT(*) AS cnt
         FROM message_logs
         WHERE timestamp BETWEEN ? AND ?
         GROUP BY status`
      )
      .all(t0, t1) as { status: string | null; cnt: number }[];

    const byStatus = Object.fromEntries(
      rows.map((r) => [r.status ?? "unknown", r.cnt])
    );

    // audit_logs: bugün gönderilen mesaj sayısı (worker kaydı)
    const sentRow = db
      .prepare(
        `SELECT COUNT(*) AS cnt
         FROM audit_logs
         WHERE action = 'worker.message.sent'
           AND created_at BETWEEN ? AND ?`
      )
      .get(t0, t1) as { cnt?: number };

    const sent = sentRow?.cnt ?? 0;

    const delivered = byStatus["delivered"] ?? 0;
    const read = byStatus["read"] ?? 0;
    const failed = byStatus["failed"] ?? 0;

    return NextResponse.json({
      ok: true,
      today: {
        sent,
        delivered,
        read,
        failed,
        // Diğer olası statüler (örn: queued, sent, etc.) için toplam
        other: Object.values(byStatus).reduce((a: number, b: number) => a + b, 0) - (delivered + read + failed),
        window: { start: t0, end: t1 },
      },
    });
  } catch (e: any) {
    console.error("stats_error", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
