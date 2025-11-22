import { NextResponse } from "next/server";
import { getLogs } from "@worker/src/log";

export async function GET() {
  try {
    const logs = await getLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
