// worker/src/scheduler.ts
import cron from "node-cron";
import { sendMuayeneReminder } from "./whatsapp";
import { fetchCustomers, updateStatus } from "./sheetsClient";
import { writeLog as log } from "./log";

/**
 * Sheet kolonları:
 * Plaka | Müşteri Adı | Telefon | Muayene Tarihi | Durum
 */

const TZ = process.env.TZ || "Europe/Istanbul";

const STATUS_SENT =
  (process.env.SHEETS_STATUS_SENT || "GÖNDERİLDİ").trim();

/* ========================= Tarih Yardımcıları ========================= */

function todayISO(): string {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;
}

// DD.MM.YYYY → YYYY-MM-DD
function toISO(input: string): string | null {
  if (!input) return null;

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return input.trim();

  // DD.MM.YYYY format
  const dmy = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(input.trim());
  if (dmy) {
    const dd = dmy[1].padStart(2, "0");
    const mm = dmy[2].padStart(2, "0");
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // parse edilebilen tarih
  const t = Date.parse(input);
  if (!isNaN(t)) {
    const dt = new Date(t);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  return null;
}

/* ========================= ANA ÇALIŞMA ========================= */

export async function runOnce() {
  await log("⏳ Scheduler başladı");

  const today = todayISO();
  await log(`📅 Bugün: ${today}`);

  const { rows } = await fetchCustomers();
  await log(`📋 Toplam satır: ${rows.length}`);

  const targets: Array<{ sheetRow: number; row: any }> = [];
  const seenPhones = new Set<string>();

  rows.forEach((r, i) => {
    const iso = toISO(r.dateRaw);
    const isToday = iso === today;
    const notSent =
      (r.status || "").trim().toUpperCase() !== STATUS_SENT.toUpperCase();
    const hasPhone = !!r.phone;

    if (isToday && notSent && hasPhone) {
      if (!seenPhones.has(r.phone)) {
        seenPhones.add(r.phone);

        // Sheets'te gerçek satır numarası = index + 2
        targets.push({
          sheetRow: i + 2,
          row: r,
        });
      }
    }
  });

  await log(`🎯 Bugün gönderilecek kişi sayısı: ${targets.length}`);

  for (const t of targets) {
    const { row, sheetRow } = t;

    await log(`📤 Gönderiliyor → ${row.phone} | ${row.name} | ${row.plate}`);

    try {
      // 🔥 PARAMETRELER DÜZELTİLDİ
      const result = await sendMuayeneReminder({
        to: row.phone,
        name: row.name,
        plate: row.plate,
        date: row.dateRaw,
      });

      // 🔥 WhatsApp API cevabını logluyoruz
      console.log("📦 WhatsApp result:", JSON.stringify(result, null, 2));

      // Saat damgası
      const time = new Date().toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      await updateStatus(sheetRow, `${STATUS_SENT} ${time}`);
      await log(`✅ Güncellendi: ROW[${sheetRow}] → ${STATUS_SENT} ${time}`);

    } catch (err: any) {
      await log(`❌ Gönderim hatası: ${row.phone} | ${err.message}`);
    }
  }

  await log("🏁 Scheduler bitti");
}

/* ========================= CRON ========================= */

export function startCron() {
  const schedule = "0 10 * * *"; // her gün 10:00

  log(`⏰ Cron ayarlandı: ${schedule} | TZ: ${TZ}`);

  cron.schedule(
    schedule,
    async () => {
      try {
        await runOnce();
      } catch (err) {
        await log(`❌ Cron runOnce hata: ${err}`);
      }
    },
    { timezone: TZ }
  );
}
