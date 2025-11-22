// worker/src/worker.ts
import { runOnce, startCron } from "./scheduler";
import { writeLog } from "./log";
import dotenv from "dotenv";
dotenv.config({ path: "./worker/.env" });

async function main() {
  await writeLog("🚀 Worker başlatılıyor: önce runOnce, sonra cron...");

  // Uygulamayı başlatırken bugünün satırlarını bir kez kontrol et
  try {
    await runOnce();
  } catch (err: any) {
    await writeLog(`❌ runOnce ilk çalıştırma hatası: ${err?.message || err}`);
  }

  // Sonra her gün belirli saatte tekrar çalışacak cron'u başlat
  startCron();

  await writeLog("⏰ Worker ayakta, cron beklemede.");
}

main().catch(async (err) => {
  await writeLog(`💥 Worker ana hata: ${err?.message || err}`);
  // process.exit(1); // istersen açabilirsin
});
