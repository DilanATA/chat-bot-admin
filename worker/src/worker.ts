// worker/src/worker.ts
import dotenv from "dotenv";
dotenv.config({ path: "./worker/.env" });

import { runOnceAllTenants } from "./index";
import { writeLog as log } from "./log";

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
