// worker/src/config.ts
import dotenv from 'dotenv';
import path from 'path';

// 🔐 worker klasöründeki .env dosyasını zorla yükle
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export const cfg = {
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  token: process.env.WHATSAPP_TOKEN || '',
  templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'muayene_hatirlatma',
  templateLang: process.env.WHATSAPP_TEMPLATE_LANG || 'tr',

  // Google Sheets (Service Account + Sheet ID)
  sheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '',
  clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL || '',
  privateKey: (process.env.GOOGLE_SHEETS_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  concurrency: Number(process.env.SEND_CONCURRENCY || 5),
  delayMs: Number(process.env.SEND_DELAY_MS || 150),
};

export function requireEnv() {
  const required = [
    'GOOGLE_SHEETS_SPREADSHEET_ID',
    'GOOGLE_SHEETS_CLIENT_EMAIL',
    'GOOGLE_SHEETS_PRIVATE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error('📛 process.env durumu:', {
      GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      GOOGLE_SHEETS_CLIENT_EMAIL: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      GOOGLE_SHEETS_PRIVATE_KEY: process.env.GOOGLE_SHEETS_PRIVATE_KEY
        ? 'VAR (uzun string)'
        : undefined,
    });
    throw new Error('Eksik .env değişkenleri: ' + missing.join(', '));
  }
}
