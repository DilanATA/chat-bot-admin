import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// PROD'da disk: /data/database.sqlite  | DEV'de proje kökü
const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), "database.sqlite");

// Diskte klasör yoksa oluştur (örn. /data)
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// Dosya yoksa oluştur
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, "");
  console.log("📦 Created database file:", DB_PATH);
}

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

console.log("🗂️  Using SQLite at:", DB_PATH);
