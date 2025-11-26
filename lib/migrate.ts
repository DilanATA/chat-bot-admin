// lib/migrate.ts
// Idempotent (tekrarlı çağrıya güvenli) migrasyonlar.
// Gereken tablolar yoksa oluşturur; varsa dokunmaz.

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export function openDb() {
  // Render Free'de kalıcı disk yoksa /tmp kullanılabilir; projende kendi yolunu tercih et
  const dbPath =
    process.env.DB_PATH ||
    path.join(process.cwd(), "data", "database.sqlite");

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

export function migrate(db: Database.Database) {
  // Tenants (opsiyonel)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT
    );
  `);

  // WhatsApp ayarları (kullandığımız alanlar)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_whatsapp_settings (
      tenant_id TEXT PRIMARY KEY,
      access_token TEXT,
      phone_number_id TEXT,
      business_id TEXT,
      verify_token TEXT,
      webhook_url TEXT
    );
  `);

  // Eski kodların ihtiyaç duyduğu olası tablolar (no such table hataları için güvenlik amaçlı)
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenant_settings (
      tenant_id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS message_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT,
      to_phone TEXT,
      payload TEXT,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Opsiyonel: import edildiğinde otomatik çalışsın (server-start)
(function auto() {
  try {
    const db = openDb();
    migrate(db);
    // db'yi açık tutmak istiyorsan export edip paylaşabilirsin; burada kapatmıyoruz.
  } catch (e) {
    // Migrasyon hatası build'i bozmasın; loglayıp geç
    console.error("Migration error:", e);
  }
})();
