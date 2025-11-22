// app/api/customers/update-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth";
import { updateStatusInSheet } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantIdFromSession(req);
    const { rowIndex, status } = await req.json();

    if (typeof rowIndex !== "number" || !status) {
      return NextResponse.json({ success: false, error: "rowIndex ve status gerekli" }, { status: 400 });
    }

    const info = await updateStatusInSheet(tenantId, rowIndex, status);
    return NextResponse.json({ success: true, info });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}
