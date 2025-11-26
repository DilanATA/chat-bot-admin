// worker/src/index.ts
import "./bootstrapEnv";
import cron from "node-cron";

import { listTenants } from "./tenants";
import { fetchRowsForTenant, updateStatus } from "./sheetsClient";
import { sendTemplateMessage } from "./whatsapp";
import { alreadySentToday } from "./dedupe";
import { filterDueCustomers, sortByDateAsc, type Customer } from "./businessRules";
import { writeLog as log } from "./log";

// ENV kontrolleri / varsayılanlar
const FILTER_MODE = (process.env.SEND_DATE_FILTER || "today_or_tomorrow").toLowerCase();
// withinDays: today_or_tomorrow => 1, only_today => 0, next_3_days => 3, next_7_days => 7
function resolveWithinDays(mode: string): number {
  switch (mode) {
    case "only_today": return 0;
    case "today_or_tomorrow": return 1;
    case "next_3_days": return 3;
    case "next_7_days": return 7;
    default: return 1;
  }
}
const WITHIN_DAYS = resolveWithinDays(FILTER_MODE);
const INCLUDE_TODAY = FILTER_MODE !== "only_today";

const THROTTLE_MS = Number(process.env.SEND_THROTTLE_MS || 200); // iki mesaj arası bekleme

async function runOnceForTenant(tenant: string) {
  log(`➡️  [${tenant}] fetchRowsForTenant...`);
  const rows = await fetchRowsForTenant(tenant);

  // Filtre & sırala
  const dueList: Customer[] = filterDueCustomers(rows as Customer[], {
    withinDays: WITHIN_DAYS,
    includeToday: INCLUDE_TODAY,
  });
  const ordered = sortByDateAsc(dueList);

  log(`ℹ️  [${tenant}] aday sayısı: ${ordered.length}`);

  for (let i = 0; i < ordered.length; i++) {
    const c = ordered[i];

    // Aynı güne iki kez gitmesin – alreadySentToday(tenant, phone) bekliyor
    if (alreadySentToday(tenant, c.phone)) {
      log(`⏭️  [${tenant}] ${c.phone} için bugün zaten gönderilmiş; atlanıyor.`);
      continue;
    }

    // Template body parametreleri (örnek: [Ad, Plaka, Tarih])
    const bodyParams = [c.name || "Müşteri", c.plate || "-", c.dateRaw || "-"];

    const res = await sendTemplateMessage({
      phone: c.phone,
      bodyParams,
      // template/lang env'den geliyor: WA_TEMPLATE_NAME / WA_TEMPLATE_LANG
    });

    if (res.ok) {
      log(`✅  [${tenant}] gönderildi: ${c.phone} (msg: ${res.message_id || "-"})`);
      // rows listesinde aynı satırı bulup "GÖNDERİLDİ" yazalım
      try {
        const idx = rows.findIndex(
          (r) => r.phone === c.phone && r.plate === c.plate && r.dateRaw === c.dateRaw
        );
        if (idx >= 0) {
          await updateStatus(idx, "GÖNDERİLDİ");
        }
      } catch (e) {
        log(`⚠️  [${tenant}] updateStatus hatası: ${(e as Error).message}`);
      }
    } else {
      log(`❌  [${tenant}] gönderim hatası: ${JSON.stringify(res.error).slice(0, 500)}`);
    }

    if (THROTTLE_MS > 0) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS));
    }
  }
}

export async function runOnceAllTenants() {
  const tenants = await listTenants(); // ["FIRMA_A", ...] bekleniyor
  for (const t of tenants) {
    try {
      await runOnceForTenant(t);
    } catch (e) {
      log(`❌  [${t}] runOnce hata: ${(e as Error).message}`);
    }
  }
}

// Scheduler – varsayılan: açık (WORKER_MODE=schedule)
if ((process.env.WORKER_MODE || "schedule").toLowerCase() === "schedule") {
  // Her saat başı
  cron.schedule("0 * * * *", async () => {
    try {
      log("⏰  CRON tick: runOnceAllTenants()");
      await runOnceAllTenants();
    } catch (e) {
      log(`❌  CRON error: ${(e as Error).message}`);
    }
  });
  log("🟢  Scheduler aktif (cron: 0 * * * *)");
} else {
  log("🟡  Scheduler devre dışı (WORKER_MODE != schedule)");
}
