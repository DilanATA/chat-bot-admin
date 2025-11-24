export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // hızlı DB ping
    db.prepare("select 1").get();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
