import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// --- DB dosyasını PROJE KÖKÜNE sabitle ---
export const DB_PATH = path.resolve(process.cwd(), "database.sqlite");

// Dosya yoksa oluştur
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "");
  console.log("📦 Created database file:", DB_PATH);
}

// Bağlan
export const db = new Database(DB_PATH);

// Sağlamlık
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("🗂️  Using SQLite at:", DB_PATH);

