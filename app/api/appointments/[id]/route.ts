import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

function getTenant(req: NextRequest): string | null {
  const url = new URL(req.url);
  const t = url.searchParams.get("tenant") || req.cookies.get("tenantId")?.value || "";
  return t.trim() || null;
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = Number.parseInt(String(context.params?.id ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const info = db.prepare(
    `DELETE FROM appointments WHERE id = ? AND tenant_id = ?`
  ).run(id, tenant);

  if (info.changes === 0)
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
