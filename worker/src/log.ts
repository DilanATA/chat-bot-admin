import fs from "fs";
import path from "path";

// Log dosyasının yolu
const LOG_FILE = path.join(process.cwd(), "worker", "logs.txt");

// Build veya import sırasında çalışmasın
// (🔥 log satırı kaldırıldı)

// Log dosyasını gerektiğinde oluştur
function ensureLogFile() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
      fs.writeFileSync(LOG_FILE, "", "utf8");
    }
  } catch (err) {
    console.error("⚠️ Log file could not be initialized:", err);
  }
}

// Log yazma fonksiyonu
export async function writeLog(data: any) {
  try {
    // Render (production) build'inde log yazmak istemiyorsan:
    if (process.env.NODE_ENV === "production") {
      console.log("🪶 writeLog skipped in production:", data);
      return;
    }

    ensureLogFile();

    const line =
      new Date().toISOString() + " | " + JSON.stringify(data) + "\n";

    await fs.promises.appendFile(LOG_FILE, line, "utf8");
    console.log("📝 Log yazıldı:", data);
  } catch (err) {
    console.error("❌ writeLog error:", err);
  }
}

// Log okuma fonksiyonu
export async function getLogs() {
  try {
    ensureLogFile();
    const content = await fs.promises.readFile(LOG_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    return lines.reverse().slice(0, 100);
  } catch (err) {
    console.error("❌ getLogs error:", err);
    return [];
  }
}

// Eski import isimlerini desteklemek için:
export const log = { write: writeLog, list: getLogs };
