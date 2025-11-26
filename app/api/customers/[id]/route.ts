import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { getTenantIdFromSession } from "../../../../lib/auth";

type Params = Promise<{ id: string }>;

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: raw } = await params;
  const seq = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(seq) || seq <= 0) {
    return NextResponse.json({ error: "Invalid id", received: raw }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body?.name ?? "").trim();
  const phone = (body?.phone ?? "").trim();
  const plate = (body?.plate ?? "").trim();
  const notes = (body?.notes ?? "").trim();

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

  try {
    const upd = db.prepare(`
      UPDATE customers
      SET name = ?, phone = ?, plate = ?, notes = ?, updated_at = datetime('now')
      WHERE tenant_id = ? AND customer_seq = ?
    `).run(name, phone, plate || null, notes || null, tenantId, seq);

    if (upd.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = db.prepare(`
      SELECT customer_seq AS id, name, phone, plate, notes, created_at AS createdAt, updated_at AS updatedAt
      FROM customers WHERE tenant_id = ? AND customer_seq = ?
    `).get(tenantId, seq);

    return NextResponse.json(updated);
  } catch (e: any) {
    if (e.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return NextResponse.json({ error: "Bu telefon bu firmada zaten kayıtlı." }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: raw } = await params;
  const seq = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isInteger(seq) || seq <= 0) {
    return NextResponse.json({ error: "Invalid id", received: raw }, { status: 400 });
  }

  const del = db.prepare(`
    DELETE FROM customers WHERE tenant_id = ? AND customer_seq = ?
  `).run(tenantId, seq);

  if (del.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
