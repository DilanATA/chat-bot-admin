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

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Sayfa1",
    });

    const rows = response.data.values || [];

    // Header hariç rowIndex ekliyoruz
    const formatted = rows.slice(1).map((r, i) => ({
      rowIndex: i + 2, // satır numarası (2. satırdan başlar)
      data: r,
    }));

    return Response.json({
      header: rows[0],
      rows: formatted,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
