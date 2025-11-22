import { NextResponse } from "next/server";
import { writeLog } from "@worker/src/log";
import { fetchCustomers, updateStatus } from "@worker/src/sheetsClient";
import { sendMuayeneReminder } from "@worker/src/whatsapp";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { phone, name, plate, dateRaw } = body;

    // WhatsApp gönderimi
    const result = await sendMuayeneReminder({
      to: phone,
      name,
      plate,
      dateText: dateRaw,
      templateName: process.env.WA_TEMPLATE_NAME!,
      lang: process.env.WA_TEMPLATE_LANG!,
    });

    // Log yaz
    await writeLog(`📤 Test Gönder → ${phone}`);

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    await writeLog(`❌ send-test hata: ${err.message}`);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
