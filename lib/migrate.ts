// lib/migrate.ts
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export function openDb(): Database {
  const dbPath =
    process.env.DB_PATH || path.join(process.cwd(), "data", "database.sqlite");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

// ⚠️ Buradaki tip artık Database (Database.Database değil!)
export function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id   TEXT PRIMARY KEY,
      name TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_whatsapp_settings (
      tenant_id       TEXT PRIMARY KEY,
      access_token    TEXT,
      phone_number_id TEXT,
      business_id     TEXT,
      verify_token    TEXT,
      webhook_url     TEXT
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id   TEXT PRIMARY KEY,
      created_at  TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id  TEXT,
      to_phone   TEXT,
      payload    TEXT,
      result     TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// (Opsiyonel) import edildiğinde sessizce migrasyon çalıştırmak istersen:
// try { const __db = openDb(); migrate(__db); } catch (e) { console.error("Migration error:", e); }
