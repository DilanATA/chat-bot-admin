// app/api/customers/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth";
import { deleteRowInSheet } from "@/lib/sheets";

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantIdFromSession(req);
    const { rowIndex } = await req.json();

    if (typeof rowIndex !== "number") {
      return NextResponse.json({ success: false, error: "rowIndex gerekli" }, { status: 400 });
    }

    const info = await deleteRowInSheet(tenantId, rowIndex);
    return NextResponse.json({ success: true, info });
  } catch (e: any) {
    // Hatanın nedenini görmek için mümkün olduğunca açık dönüyoruz
    return NextResponse.json(
      { success: false, error: e?.message || String(e), stack: e?.stack },
      { status: 500 }
    );
  }
}
