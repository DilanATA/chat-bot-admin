// app/api/tenant/settings/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");
  if (!tenant) {
    return NextResponse.json({ ok: false, error: "tenant is required" }, { status: 400 });
  }

  const row = db.prepare("SELECT * FROM tenant_settings WHERE tenant=?").get(tenant);
  return NextResponse.json({ ok: true, data: row || null });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");
  if (!tenant) {
    return NextResponse.json({ ok: false, error: "tenant is required" }, { status: 400 });
  }

  const body = await req.json();
  const { sheet_id, sheet_name, date_col, phone_col, plate_col, status_col } = body || {};

  if (!sheet_id || !sheet_name) {
    return NextResponse.json({ ok: false, error: "sheet_id & sheet_name required" }, { status: 400 });
  }

  const upsert = db.prepare(`
    INSERT INTO tenant_settings (tenant, sheet_id, sheet_name, date_col, phone_col, plate_col, status_col)
    VALUES (@tenant, @sheet_id, @sheet_name, @date_col, @phone_col, @plate_col, @status_col)
    ON CONFLICT(tenant) DO UPDATE SET
      sheet_id=excluded.sheet_id,
      sheet_name=excluded.sheet_name,
      date_col=excluded.date_col,
      phone_col=excluded.phone_col,
      plate_col=excluded.plate_col,
      status_col=excluded.status_col
  `);

  upsert.run({
    tenant,
    sheet_id,
    sheet_name,
    date_col: Number(date_col ?? 4),
    phone_col: Number(phone_col ?? 3),
    plate_col: Number(plate_col ?? 1),
    status_col: Number(status_col ?? 5),
  });

  logAudit(tenant, "tenant_settings.update", { sheet_id, sheet_name, date_col, phone_col, plate_col, status_col });
  return NextResponse.json({ ok: true });
}
