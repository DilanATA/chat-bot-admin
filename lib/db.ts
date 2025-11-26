// lib/db.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH =
  process.env.DB_PATH || path.join(process.cwd(), "database.sqlite");

// Global cache (tipleri gevşetiyoruz ki build kırılmasın)
declare global {
  // eslint-disable-next-line no-var
  var __db: any | undefined;
}

function open() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db: any = new (Database as any)(DB_PATH);

  // Kilitlenmeleri azalt
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000"); // 5 sn bekle

  return db;
}

export const db: any = (globalThis as any).__db ?? open();
if (!(globalThis as any).__db) (globalThis as any).__db = db;
