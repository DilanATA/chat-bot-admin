import { google } from "googleapis";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      action,
      plate = "",
      name = "",
      phone = "",
      date = "",
      status = "",
    } = body;

    if (!action) {
      return Response.json(
        { error: "Missing action" },
        { status: 400 }
      );
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const now = new Date();
    const timestamp =
      now.toLocaleDateString("en-US") +
      " " +
      now.toLocaleTimeString("en-US");

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: "Logs!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, action, plate, name, phone, date, status]],
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
