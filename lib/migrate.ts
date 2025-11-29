// lib/migrate.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let dbInstance: any = null;

export function openDb() {
  if (dbInstance) return dbInstance;

  const isProd = process.env.NODE_ENV === "production";
  const dbPath = isProd
    ? "/tmp/database.sqlite"
    : process.env.DB_PATH || path.join(process.cwd(), "data", "database.sqlite");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath, {
    fileMustExist: false,
    timeout: 5000,
  });

  try {
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("synchronous = NORMAL");
  } catch (err) {
    console.warn("⚠️ SQLite PRAGMA ayarlanamadı:", err);
  }

  dbInstance = db;
  return dbInstance;
}

export function migrate(db: any): void {
  if (!db) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id   TEXT PRIMARY KEY,
      name TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_whatsapp_settings (
      tenant         TEXT PRIMARY KEY,
      access_token    TEXT,
      phone_number_id TEXT,
      business_id     TEXT,
      verify_token    TEXT,
      webhook_url     TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant      TEXT PRIMARY KEY,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant     TEXT,
      to_phone   TEXT,
      payload    TEXT,
      result     TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
