import { google } from "googleapis";

export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // 1) Tüm sayfayı oku
    const read = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Sayfa1",
    });

    const rows = read.data.values || [];

    // Header hariç
    const dataRows = rows.slice(1);

    // 2) Boş olanları bul
    let deleteIndices = [];

    dataRows.forEach((row, i) => {
      const isEmpty = row.every((cell) => cell === "" || cell === undefined);
      if (isEmpty) deleteIndices.push(i + 1); // header offset + 1
    });

    if (deleteIndices.length === 0) {
      return Response.json({ message: "Silinecek satır yok" });
    }

    // 3) Delete requests
    const requests = deleteIndices
      .map((rowIndex) => ({
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: "ROWS",
            startIndex: rowIndex,
            endIndex: rowIndex + 1,
          },
        },
      }))
      // Sheet yukarı doğru kaydığı için tersten silmek zorundayız
      .reverse();

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      requestBody: { requests },
    });

    return Response.json({
      success: true,
      deleted: deleteIndices.length,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
