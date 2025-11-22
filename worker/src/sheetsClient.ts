// worker/src/sheetsClient.ts
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import type { SheetRow, TenantSettings } from "./types";

function auth() {
  const email = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const rawKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  if (!email) throw new Error("GOOGLE_SHEETS_CLIENT_EMAIL missing (.env.local)");
  if (!rawKey) throw new Error("GOOGLE_SHEETS_PRIVATE_KEY missing (.env.local)");
  const key = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  return new JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export async function fetchRowsForTenant(ts: TenantSettings): Promise<SheetRow[]> {
  const doc = new GoogleSpreadsheet(ts.sheet_id, auth());
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[ts.sheet_name];
  if (!sheet) throw new Error(`Sheet not found: ${ts.sheet_name}`);

  // 🔧 ÖNEMLİ: headerValues erişmeden önce başlığı yükle
  try {
    await sheet.loadHeaderRow();
  } catch {
    /* bazı tablolarda Header hiç ayarlı olmayabilir; sorun değil */
  }
  const headers: string[] = Array.isArray((sheet as any).headerValues)
    ? (sheet as any).headerValues
    : [];

  const rowsRaw = await sheet.getRows();

  // Güvenli değer okuyucu: önce header ile dene, yoksa _rawData index’i kullan
  const val = (row: any, oneBasedCol: number) => {
    const idx = oneBasedCol - 1;
    const header = headers[idx];
    if (header && typeof row.get === "function") {
      const v = row.get(header);
      if (v !== undefined && v !== null) return String(v);
    }
    const raw = (row as any)._rawData?.[idx];
    return raw !== undefined && raw !== null ? String(raw) : "";
  };

  // ... mevcut kodun içinde, return map(...) içinde alanlara ekle:
  return rowsRaw.map((r: any, i: number) => ({
    rowIndex: (r.rowNumber ?? i + 2) - 2,
    plate:  val(r, ts.plate_col).trim(),
    phone:  val(r, ts.phone_col).trim(),
    dateRaw: val(r, ts.date_col).trim(),
    status: val(r, ts.status_col).trim(),
    name:   val(r, 2).trim(), // <-- B sütunu: isim (şimdilik varsayıyoruz)
  }));

}

export async function updateStatus(ts: TenantSettings, rowIndex: number, newStatus: string) {
  const doc = new GoogleSpreadsheet(ts.sheet_id, auth());
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[ts.sheet_name];
  if (!sheet) throw new Error(`Sheet not found: ${ts.sheet_name}`);

  const statusColIndex = ts.status_col - 1; // 0-based
  await sheet.loadCells({
    startRowIndex: rowIndex + 1,     // header satırını atla
    endRowIndex: rowIndex + 2,
    startColumnIndex: statusColIndex,
    endColumnIndex: statusColIndex + 1,
  });

  const cell = sheet.getCell(rowIndex + 1, statusColIndex);
  cell.value = newStatus;
  await sheet.saveUpdatedCells();
}
