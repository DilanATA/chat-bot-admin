// lib/migrate_sheets.ts
import { db } from "./db";

db.prepare(`
  CREATE TABLE IF NOT EXISTS tenant_sheet_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT NOT NULL UNIQUE,
    spreadsheet_id TEXT NOT NULL,
    sheet_title TEXT NOT NULL
  )
`).run();

// İstersen ilk kayıt (env'deki sheet ile) — yoksa dokunmaz.
if (process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
  db.prepare(`
    INSERT OR IGNORE INTO tenant_sheet_configs (tenant_id, spreadsheet_id, sheet_title)
    VALUES (?, ?, ?)
  `).run(
    "FIRMA_A",
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    process.env.GOOGLE_SHEETS_SHEET_TITLE || "Sayfa1"
  );
}

console.log("✅ tenant_sheet_configs ready.");
