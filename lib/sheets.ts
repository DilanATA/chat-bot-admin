// lib/sheets.ts
import "server-only";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { db } from "@/lib/db";

type TenantCfg = { spreadsheet_id?: string; sheet_title?: string } | undefined;

/* ======================= Tenant Config ======================= */

export function getTenantSheetConfig(tenantId?: string) {
  if (!tenantId) {
    return {
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
      sheetTitle: process.env.GOOGLE_SHEETS_SHEET_TITLE || "Sayfa1",
    };
  }

  const row = db
    .prepare(
      `SELECT spreadsheet_id, sheet_title
         FROM tenant_sheet_configs
        WHERE tenant_id = ?`
    )
    .get(tenantId) as TenantCfg;

  return {
    spreadsheetId: row?.spreadsheet_id || process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    sheetTitle: row?.sheet_title || process.env.GOOGLE_SHEETS_SHEET_TITLE || "Sayfa1",
  };
}

export async function getSheetForTenant(tenantId?: string) {
  const { spreadsheetId, sheetTitle } = getTenantSheetConfig(tenantId);

  const auth = new JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();

  let sheet = doc.sheetsByTitle[sheetTitle];
  if (!sheet) sheet = doc.sheetsByIndex[0];
  if (!sheet) throw new Error("Sheet bulunamadı");

  await sheet.loadHeaderRow();
  return sheet;
}

/* ======================= Header Eşleştirme ======================= */

const HEADER_ALIASES: Record<string, string[]> = {
  plate:   ["Plaka", "Plate"],
  name:    ["Müşteri Adı", "Musteri Adi", "Ad Soyad", "Name", "Customer"],
  phone:   ["Telefon", "Phone"],
  dateRaw: ["Muayene Tarihi", "Tarih", "Date"],
  status:  ["Durum", "Status"],
};

function resolveHeaderKey(headerValues: string[], keys: string[]) {
  const lower = headerValues.map((h) => h.toLowerCase().trim());
  for (const k of keys) {
    const i = lower.indexOf(k.toLowerCase().trim());
    if (i !== -1) return headerValues[i];
  }
  return undefined;
}

export function getHeaderMap(sheet: any) {
  const hv: string[] = sheet.headerValues || [];
  return {
    plate:   resolveHeaderKey(hv, HEADER_ALIASES.plate),
    name:    resolveHeaderKey(hv, HEADER_ALIASES.name),
    phone:   resolveHeaderKey(hv, HEADER_ALIASES.phone),
    dateRaw: resolveHeaderKey(hv, HEADER_ALIASES.dateRaw),
    status:  resolveHeaderKey(hv, HEADER_ALIASES.status),
  };
}

export function mapRowToCustomer(row: any, h: ReturnType<typeof getHeaderMap>, index: number) {
  return {
    id: `sheet-${index + 2}`, // gerçek satır (header=1, veri=2..)
    plate:   h.plate   ? String(row[h.plate]   ?? "").trim() : "",
    name:    h.name    ? String(row[h.name]    ?? "").trim() : "",
    phone:   h.phone   ? String(row[h.phone]   ?? "").trim() : "",
    dateRaw: h.dateRaw ? String(row[h.dateRaw] ?? "").trim() : "",
    status:  h.status  ? String(row[h.status]  ?? "").trim() : "",
    __source: "sheets",
  };
}

/* ======================= A1 Yardımcıları ======================= */

function colNumberToA1(n: number) {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = ((n - 1) / 26) | 0;
  }
  return s;
}

function a1(col1Based: number, row1Based: number) {
  return `${colNumberToA1(col1Based)}${row1Based}`;
}

/* ======================= CRUD ======================= */

export async function addCustomerToSheet(
  tenantId: string | undefined,
  data: { plate: string; name: string; phone: string; dateRaw: string; status?: string }
) {
  const sheet = await getSheetForTenant(tenantId);
  const h = getHeaderMap(sheet);

  const row: Record<string, string> = {};
  if (h.plate)   row[h.plate]   = data.plate;
  if (h.name)    row[h.name]    = data.name;
  if (h.phone)   row[h.phone]   = data.phone;
  if (h.dateRaw) row[h.dateRaw] = data.dateRaw;
  if (h.status)  row[h.status]  = data.status ?? "";

  await sheet.addRow(row);
}

export async function updateStatusInSheet(
  tenantId: string | undefined,
  rowIndex: number, // 0-based (UI index)
  status: string
) {
  const sheet = await getSheetForTenant(tenantId);
  await sheet.loadHeaderRow();

  const h = getHeaderMap(sheet);
  if (!h.status) throw new Error("Durum/Status başlığı bulunamadı");

  const headers: string[] = sheet.headerValues || [];
  const colIdx0 = headers.indexOf(h.status);
  if (colIdx0 === -1) throw new Error(`Başlık bulunamadı: ${h.status}`);
  const col1 = colIdx0 + 1;

  const sheetRow = rowIndex + 2; // gerçek satır (header=1)
  const targetA1 = a1(col1, sheetRow);

  await sheet.loadCells(targetA1);
  const cell = sheet.getCellByA1(targetA1);
  cell.value = status;
  await sheet.saveUpdatedCells();

  await sheet.loadCells(targetA1);
  const after = sheet.getCellByA1(targetA1).value;

  return { ok: true, a1: targetA1, after };
}

export async function deleteRowInSheet(
  tenantId: string | undefined,
  rowIndex: number // 0-based (UI index)
) {
  const sheet = await getSheetForTenant(tenantId);

  // En güvenlisi: önce rows[]’ten satırı al, satırın gerçek numarasını bul, sonra grid üzerinden sil.
  const rows = await sheet.getRows(); // veri satırları (header hariç)
  if (rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(`Geçersiz rowIndex: ${rowIndex} (rows.length=${rows.length})`);
  }

  const r = rows[rowIndex] as any;
  const rowNumber: number = r.rowNumber ?? r._rowNumber; // 1-based gerçek satır numarası
  if (!rowNumber || rowNumber < 2) {
    throw new Error(`Satır numarası okunamadı (rowNumber=${rowNumber})`);
  }

  // Grid 0-based index ister: rowNumber 1-based olduğu için -1
  await sheet.deleteRows(rowNumber - 1, 1);

  return { ok: true, deletedRow: rowNumber };
}
