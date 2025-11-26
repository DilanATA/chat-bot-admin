// worker/src/sheetsClient.ts
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

/**
 * Google Sheets kolonu varsayılan başlıkları:
 *   plate | name | phone | dateRaw | status
 * Eğer farklı başlıklar kullanıyorsan, aşağıdaki HEADER_MAP'i düzenle.
 */
const HEADER_MAP = {
  plate: "plate",
  name: "name",
  phone: "phone",
  dateRaw: "dateRaw",
  status: "status",
};

// ENV
const SHEETS_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "";
const SHEETS_PRIVATE_KEY_RAW = process.env.GOOGLE_SHEETS_PRIVATE_KEY || "";
const SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "";
const SHEET_TITLE = process.env.GOOGLE_SHEETS_SHEET_TITLE || "Sayfa1";

// Private key newline fix (Render/GitHub env için)
const SHEETS_PRIVATE_KEY = SHEETS_PRIVATE_KEY_RAW.replace(/\\n/g, "\n");

// Tip
export interface CustomerRow {
  plate: string;
  name: string;
  phone: string;
  dateRaw: string;
  status: string;
}

/**
 * Ortak sheet erişimi
 */
async function getSheet() {
  if (!SHEETS_CLIENT_EMAIL || !SHEETS_PRIVATE_KEY || !SHEETS_SPREADSHEET_ID) {
    throw new Error(
      "Google Sheets ENV eksik. Gerekli: GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID"
    );
  }

  const auth = new JWT({
    email: SHEETS_CLIENT_EMAIL,
    key: SHEETS_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(SHEETS_SPREADSHEET_ID, auth);
  await doc.loadInfo();

  const sheet = doc.sheetsByTitle[SHEET_TITLE];
  if (!sheet) {
    throw new Error(`Sheet bulunamadı: ${SHEET_TITLE}`);
  }
  return sheet;
}

/**
 * Tüm müşterileri oku (başlıklara göre map’ler)
 */
export async function fetchCustomers(): Promise<CustomerRow[]> {
  const sheet = await getSheet();
  const rows = await sheet.getRows();

  const list: CustomerRow[] = rows.map((r: any) => {
    // Başlık adlarına güveniyoruz (HEADER_MAP)
    const plate = String(r[HEADER_MAP.plate] ?? "").trim();
    const name = String(r[HEADER_MAP.name] ?? "").trim();
    const phone = String(r[HEADER_MAP.phone] ?? "").trim();
    const dateRaw = String(r[HEADER_MAP.dateRaw] ?? "").trim();
    const status = String(r[HEADER_MAP.status] ?? "").trim();
    return { plate, name, phone, dateRaw, status };
  });

  return list;
}

/**
 * Status güncelle (0-based row index — header hariç)
 * Not: sheet.getRows() 0 index = header’dan sonraki ilk veri satırıdır.
 * Yani UI/worker 0 diyorsa, rows[0] doğru satırdır.
 */
export async function updateStatus(rowIndex: number, status: string) {
  const sheet = await getSheet();
  const rows = await sheet.getRows();

  if (rowIndex < 0 || rowIndex >= rows.length) {
    throw new Error(`updateStatus: Geçersiz rowIndex: ${rowIndex}`);
  }

  const row: any = rows[rowIndex];
  row[HEADER_MAP.status] = status;
  await row.save();
}

/**
 * (Opsiyonel) Tek satır silmek istersen:
 * Types uyumsuzluğu yüzünden TS uyarısını aşmak için any cast kullanılır.
 */
// export async function deleteRow(rowIndex: number) {
//   const sheet = await getSheet();
//   await (sheet as any).deleteRows(rowIndex, 1);
// }
// ─────────────────────────────────────────────────────────────
// Geçici wrapper: index.ts fetchRowsForTenant bekliyor.
// Şimdilik tenant parametresini kullanmadan tüm satırları döndürüyoruz.
// İleride her tenant için farklı Sheet ID/Title okumak istersen,
// burayı tenant'a göre sheet seçimi yapacak şekilde genişletebilirsin.
export async function fetchRowsForTenant(_tenant: string): Promise<CustomerRow[]> {
  return fetchCustomers();
}
