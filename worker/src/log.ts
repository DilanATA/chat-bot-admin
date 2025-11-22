import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "worker", "logs.txt");
console.log("🔥 writeLog yüklendi");

// LOG dosyasını oluştur (yoksa)
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, "", "utf8");
}

// Log yazma
export async function writeLog(data: any) {
  console.log("🔥 writeLog çalıştı:", data);
  const line =
    new Date().toISOString() + " | " + JSON.stringify(data) + "\n";

  await fs.promises.appendFile(LOG_FILE, line, "utf8");
}

// Log okuma
export async function getLogs() {
  try {
    const content = await fs.promises.readFile(LOG_FILE, "utf8");
    const lines = content.split("\n").filter((l) => l.trim() !== "");
    return lines.reverse().slice(0, 100);
  } catch {
    return [];
  }
}

// Eski import isimlerini desteklemek için:
export const log = { write: writeLog, list: getLogs };
