// app/api/customers/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth";
import { addCustomerToSheet } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantIdFromSession(req);
    const { plate, name, phone, dateRaw, status } = await req.json();

    if (!plate || !name || !phone || !dateRaw) {
      return NextResponse.json({ success: false, error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    await addCustomerToSheet(tenantId, { plate, name, phone, dateRaw, status });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
