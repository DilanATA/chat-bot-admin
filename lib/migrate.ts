// lib/migrate.ts
// ✅ Render uyumlu, kilitlenmeyen (SQLITE_BUSY yok) SQLite yöneticisi

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Tek bağlantı (singleton)
let dbInstance: any = null;

/**
 * SQLite bağlantısını döndürür (tekil/singleton)
 * Aynı process içinde birden fazla bağlantı açmaz.
 * busy_timeout -> 5 sn bekler, hemen hata vermez.
 */
export function openDb() {
  if (dbInstance) return dbInstance;

  const dbPath =
    process.env.DB_PATH || path.join(process.cwd(), "data", "database.sqlite");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(dbPath, { fileMustExist: false });

  try {
    db.pragma("journal_mode = WAL");      // daha güvenli paralel yazma
    db.pragma("busy_timeout = 5000");     // 5 sn bekleme süresi
    db.pragma("synchronous = NORMAL");    // hız için optimize
  } catch (err) {
    console.warn("⚠️ SQLite PRAGMA ayarlanamadı:", err);
  }

  dbInstance = db;
  return dbInstance;
}

/**
 * Tabloları oluşturur (idempotent)
 * Deploy sırasında tablo yoksa kurar, varsa dokunmaz.
 */
export function migrate(db: any): void {
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

// ✅ Render için otomatik migration (isteğe bağlı)
try {
  const db = openDb();
  migrate(db);
  console.log("🧩 Database ready (migrations applied)");
} catch (err) {
  console.error("❌ Database migration failed:", err);
}
