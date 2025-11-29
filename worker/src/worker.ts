// worker/src/worker.ts
import dotenv from "dotenv";
dotenv.config({ path: "./worker/.env" });

import { runOnceAllTenants } from "./index";
import { writeLog as log } from "./log";
process.env.RUN_MIGRATION = "true";

import { openDb, migrate } from "lib/migrate";

const db = openDb();
migrate(db);
console.log("✅ Worker DB ready");


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
