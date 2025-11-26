// app/api/appointment-types/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

function getTenant(req: NextRequest): string | null {
  const url = new URL(req.url);
  const t =
    url.searchParams.get("tenant") ||
    req.cookies.get("tenantId")?.value ||
    "";
  return t.trim() || null;
}

// ── GET /api/appointment-types/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number.parseInt(String(idStr ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = db
    .prepare(`SELECT id, name FROM appointment_types WHERE id = ? AND tenant_id = ?`)
    .get(id, tenant);

  if (!row) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

// ── PUT /api/appointment-types/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number.parseInt(String(idStr ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name gerekli" }, { status: 400 });

  const info = db
    .prepare(
      `UPDATE appointment_types SET name = ? WHERE id = ? AND tenant_id = ?`
    )
    .run(name, id, tenant);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// ── DELETE /api/appointment-types/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const id = Number.parseInt(String(idStr ?? ""), 10);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const info = db
    .prepare(`DELETE FROM appointment_types WHERE id = ? AND tenant_id = ?`)
    .run(id, tenant);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
