export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

// GET → Meta verification (hub.challenge)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WABA_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "OK", { status: 200 });
  }
  return NextResponse.json({ ok: false, error: "verify_failed" }, { status: 403 });
}

// POST → WhatsApp status events (delivered/read/failed) VEYA bizim test json’ı
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1) Önce bizim basit test formatımızı destekle (local simülasyon)
    // {
    //   tenant: "FIRMA_A",
    //   phone: "+90555...",
    //   message_id: "wamid.XXXX",
    //   status: "delivered" | "read" | "failed",
    //   timestamp: 1732272000000
    // }
    if (body?.tenant && body?.message_id && body?.status) {
      const { tenant, phone, message_id, status, timestamp } = body;

      // DB update/insert
      const row = db.prepare(
        "SELECT id FROM message_logs WHERE tenant=? AND message_id=?"
      ).get(tenant, message_id) as { id?: number } | undefined;

      const ts = Number(timestamp || Date.now());
      if (row?.id) {
        db.prepare(
          "UPDATE message_logs SET status=?, timestamp=? WHERE id=?"
        ).run(status, ts, row.id);
      } else {
        db.prepare(
          "INSERT INTO message_logs (tenant, phone, message_id, status, timestamp) VALUES (?, ?, ?, ?, ?)"
        ).run(tenant, phone ?? null, message_id, status, ts);
      }

      logAudit(tenant, "webhook.manual.status", { message_id, phone, status, ts });
      return NextResponse.json({ ok: true });
    }

    // 2) Meta’nın gerçek webhook formatını işle
    // Kaynak: WhatsApp Business API Webhooks
    // events → entry[0].changes[0].value.statuses[0]
    const entry = Array.isArray(body?.entry) ? body.entry : [];
    for (const e of entry) {
      const changes = Array.isArray(e?.changes) ? e.changes : [];
      for (const ch of changes) {
        const value = ch?.value;
        const statuses = Array.isArray(value?.statuses) ? value.statuses : [];

        for (const st of statuses) {
          const message_id = st?.id;
          const status = st?.status; // sent | delivered | read | failed | etc.
          const tsSec = Number(st?.timestamp || 0);
          const phone = value?.metadata?.display_phone_number
            ? `+${String(value.metadata.display_phone_number).replace(/\D+/g, "")}`
            : null;

          if (!message_id || !status) continue;

          // Biz tenant'ı URL ile alamıyoruz → tek tenant ise "FIRMA_A",
          // çoklu ise mapping tablosu ekleyebilirsin. Şimdilik varsayılan:
          const tenant = "FIRMA_A";

          const ts = tsSec ? tsSec * 1000 : Date.now();

          const row = db.prepare(
            "SELECT id FROM message_logs WHERE tenant=? AND message_id=?"
          ).get(tenant, message_id) as { id?: number } | undefined;

          if (row?.id) {
            db.prepare(
              "UPDATE message_logs SET status=?, timestamp=? WHERE id=?"
            ).run(status, ts, row.id);
          } else {
            db.prepare(
              "INSERT INTO message_logs (tenant, phone, message_id, status, timestamp) VALUES (?, ?, ?, ?, ?)"
            ).run(tenant, phone, message_id, status, ts);
          }

          logAudit(tenant, "webhook.meta.status", { message_id, phone, status, ts });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
