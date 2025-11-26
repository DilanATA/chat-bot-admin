// app/api/migrate/route.ts
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { migrate } from "@/lib/migrate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await migrate();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
