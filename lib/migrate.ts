// lib/migrate.ts
import { db } from "./db";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant TEXT PRIMARY KEY,
    sheet_id TEXT NOT NULL,
    sheet_name TEXT NOT NULL,
    date_col INTEGER NOT NULL,
    phone_col INTEGER NOT NULL,
    plate_col INTEGER NOT NULL,
    status_col INTEGER NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant TEXT,
    phone TEXT,
    message_id TEXT,
    status TEXT,
    timestamp INTEGER
  );`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant TEXT,
    action TEXT,
    details TEXT,
    created_at INTEGER
  );`
];

function run() {
  const tx = db.transaction(() => {
    for (const sql of MIGRATIONS) db.prepare(sql).run();
  });
  tx();
  console.log("✅ Migrations applied.");
}

run();
