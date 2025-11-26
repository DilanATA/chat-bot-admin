// lib/migrate.ts
import { db } from "./db";

const MIGRATIONS: string[] = [
  // Çok kiracılı genel ayarlar
  `CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant TEXT PRIMARY KEY,
    sheet_id TEXT NOT NULL,
    sheet_name TEXT NOT NULL,
    date_col INTEGER NOT NULL,
    phone_col INTEGER NOT NULL,
    plate_col INTEGER NOT NULL,
    status_col INTEGER NOT NULL
  );`,

  // WhatsApp ayarları (tenant bazlı)
  `CREATE TABLE IF NOT EXISTS tenant_whatsapp_settings (
    tenant_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    business_id TEXT,
    verify_token TEXT,
    webhook_url TEXT,
    updated_at TEXT
  );`,

  // Randevu tipleri ve randevular (varsa kullanıyoruz)
  `CREATE TABLE IF NOT EXISTS appointment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(tenant_id, name)
  );`,

  `CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL,
    type_id INTEGER,
    name TEXT,
    plate TEXT,
    phone TEXT,
    date_raw TEXT,
    status TEXT
  );`,

  // Mesaj logları
  `CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant TEXT,
    phone TEXT,
    message_id TEXT,
    status TEXT,
    timestamp INTEGER
  );`,

  // Audit log
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant TEXT,
    action TEXT,
    details TEXT,
    created_at INTEGER
  );`
];

export async function migrate(): Promise<void> {
  const tx = db.transaction(() => {
    for (const sql of MIGRATIONS) db.prepare(sql).run();
  });
  tx();
  console.log("✅ DB migrations applied.");
}
