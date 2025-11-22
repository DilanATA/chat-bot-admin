// worker/src/storage.ts
import Database from 'better-sqlite3';
import dayjs from 'dayjs';

const db = new Database('./muayene-reminder.db');

export function migrate() {
  db.prepare(
    `CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      plate TEXT NOT NULL,
      date TEXT NOT NULL,
      sent_at TEXT NOT NULL
    );`
  ).run();
}

export function wasSentToday(phone: string, plate: string, date: string) {
  const today = dayjs().format('YYYY-MM-DD');

  const row = db
    .prepare(
      `SELECT 1 
       FROM reminders 
       WHERE phone = ? AND plate = ? AND date = ?
       AND substr(sent_at,1,10) = ?
       LIMIT 1`
    )
    .get(phone, plate, date, today);

  return !!row;
}

export function markSent(phone: string, plate: string, date: string) {
  const now = dayjs().toISOString();

  db.prepare(
    `INSERT INTO reminders (phone, plate, date, sent_at)
     VALUES (?, ?, ?, ?)`
  ).run(phone, plate, date, now);
}

if (process.argv.includes('--migrate')) {
  migrate();
  console.log('✅ SQLite migrate tamam');
}
