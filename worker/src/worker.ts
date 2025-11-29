// worker/src/worker.ts
import dotenv from "dotenv";
dotenv.config({ path: "./worker/.env" });

// Bu flag build sırasında değil, runtime'da migration yapılmasını sağlar
process.env.RUN_MIGRATION = "true";

import { runOnceAllTenants } from "./index";
import { writeLog as log } from "./log";
import { openDb, migrate } from "../lib/migrate";

// 🧩 Sadece runtime’da migration çalıştır
if (process.env.RUN_MIGRATION === "true") {
  try {
    const db = openDb();
    migrate(db);
    console.log("✅ Worker DB ready (migrations applied)");
  } catch (err) {
    console.error("❌ Worker migration failed:", err);
  }
}

// CLI ve eski importlar için geriye dönük uyumluluk
export async function runOnce() {
  await runOnceAllTenants();
}

/**
 * Not: Cron planlaması index.ts içinde WORKER_MODE üzerinden yapılıyor.
 * Burada sadece bilgi mesajı bırakıyoruz.
 */
export async function startCron() {
  await log("Scheduler index.ts tarafından yönetiliyor (WORKER_MODE=schedule).");
}
