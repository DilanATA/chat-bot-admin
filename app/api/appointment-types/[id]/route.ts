import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantIdFromSession } from "@/lib/auth";

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const parsedId = Number.parseInt(String(id ?? "").trim(), 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const res = db
      .prepare(
        `
        UPDATE appointment_types
        SET name = ?, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = ? AND id = ?
        `
      )
      .run(name, tenantId, parsedId);

    if (res.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = db
      .prepare(
        `
        SELECT id, name, created_at AS createdAt, updated_at AS updatedAt
        FROM appointment_types
        WHERE tenant_id = ? AND id = ?
        `
      )
      .get(tenantId, parsedId);

    return NextResponse.json(row);
  } catch (e: any) {
    if (String(e?.message || "").includes("UNIQUE")) {
      return NextResponse.json({ error: "Bu firmada aynı isim zaten var" }, { status: 409 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const parsedId = Number.parseInt(String(id ?? "").trim(), 10);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const res = db
    .prepare(`DELETE FROM appointment_types WHERE tenant_id = ? AND id = ?`)
    .run(tenantId, parsedId);

  if (res.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
