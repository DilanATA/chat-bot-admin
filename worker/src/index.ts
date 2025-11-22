// worker/src/index.ts, dedupe.ts vb.
import "./bootstrapEnv";
import { listTenants } from "./tenants";
import { fetchRowsForTenant, updateStatus } from "./sheetsClient";
import { sendTemplateMessage } from "./whatsapp";
import { normalizePhoneTR, isToday } from "./utils";
import { alreadySentToday } from "./dedupe";
import { db } from "../../lib/db";
import { logAudit } from "../../lib/audit";

const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || "muayene_hatirlatma"; // onaylı olmalı

async function processTenant(tenant: string) {
  const ts = listTenants().find(t => t.tenant === tenant);
  if (!ts) throw new Error(`Tenant ayarı bulunamadı: ${tenant}`);

  const rows = await fetchRowsForTenant(ts);

  let total = 0, skippedStatus = 0, skippedDedupe = 0, sent = 0, failed = 0;

  for (const row of rows) {
    total++;
    try {
      const status = (row.status || "").toUpperCase().trim();
      if (status.startsWith("GÖNDERİLDİ") || status.startsWith("GONDERILDI") || status.startsWith("OK")) {
        skippedStatus++; continue;
      }

      const phone = normalizePhoneTR(row.phone);
      if (!phone || phone.length < 10) { skippedStatus++; continue; }

      if (alreadySentToday(tenant, phone)) { skippedDedupe++; continue; }

      const result = await sendTemplateMessage({
        phone,
        template: TEMPLATE_NAME,
        lang: "tr",
        bodyParams: [
          row.name || "-",          // {{1}} Ad Soyad
          row.plate || "-",         // {{2}} Plaka
          row.dateRaw || "-"        // {{3}} Tarih (ör. 22.11.2025)
        ],
      });


      if (result.ok) {
        const message_id = result.message_id || null;
        db.prepare(
          "INSERT INTO message_logs (tenant, phone, message_id, status, timestamp) VALUES (?, ?, ?, ?, ?)"
        ).run(tenant, phone, message_id, "sent", Date.now());
        logAudit(tenant, "worker.message.sent", { phone, template: TEMPLATE_NAME, message_id });

        const stamp = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        await updateStatus(ts, row.rowIndex, `GÖNDERİLDİ ${stamp}`);
        sent++;
      } else {
        db.prepare(
          "INSERT INTO message_logs (tenant, phone, message_id, status, timestamp) VALUES (?, ?, ?, ?, ?)"
        ).run(tenant, phone, null, "failed", Date.now());
        logAudit(tenant, "worker.message.failed", { phone, template: TEMPLATE_NAME, error: result.error });
        failed++;
      }
    } catch (e: any) {
      logAudit(tenant, "worker.row.error", { rowIndex: row.rowIndex, error: e?.message || String(e) });
      failed++;
    }
  }

  console.log(`📦 ${tenant} summary → total:${total} sent:${sent} dedupe:${skippedDedupe} skipped:${skippedStatus} failed:${failed}`);
}

async function runOnce() {
  const tenants = listTenants();
  for (const t of tenants) {
    await processTenant(t.tenant);
  }
}

const argOnce = process.argv.includes("--once");
if (argOnce) {
  runOnce()
    .then(() => { console.log("✅ Worker once done."); process.exit(0); })
    .catch((e) => { console.error(e); process.exit(1); });
} else {
  // 5 dakikada bir tarasın (MVP)
  const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 300_000);
  console.log("⏱️ Worker loop started. Interval(ms):", intervalMs);
  runOnce().catch(console.error);
  setInterval(() => runOnce().catch(console.error), intervalMs);
}
