// app/api/customers/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth";
import { getSheetForTenant, getHeaderMap, mapRowToCustomer } from "@/lib/sheets";

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantIdFromSession(req); // yoksa undefined kalabilir
    const sheet = await getSheetForTenant(tenantId);
    const h = getHeaderMap(sheet);
    const rows = await sheet.getRows();
    const data = rows.map((r: any, i: number) => mapRowToCustomer(r, h, i));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
