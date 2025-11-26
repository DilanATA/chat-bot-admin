// app/api/customers/[id]/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';
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

// ── GET /api/customers/:id
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
    .prepare(
      `SELECT id, name, phone, plate, date_raw as dateRaw, status
         FROM customers
        WHERE id = ? AND tenant_id = ?`
    )
    .get(id, tenant);

  if (!row) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true, data: row });
}

// ── PUT /api/customers/:id
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
  const phone = String(body?.phone ?? "").trim();
  const plate = String(body?.plate ?? "").trim();
  const dateRaw = String(body?.dateRaw ?? "").trim();
  const status = String(body?.status ?? "").trim();

  const info = db
    .prepare(
      `UPDATE customers
          SET name = COALESCE(NULLIF(?, ''), name),
              phone = COALESCE(NULLIF(?, ''), phone),
              plate = COALESCE(NULLIF(?, ''), plate),
              date_raw = COALESCE(NULLIF(?, ''), date_raw),
              status = COALESCE(NULLIF(?, ''), status)
        WHERE id = ? AND tenant_id = ?`
    )
    .run(name, phone, plate, dateRaw, status, id, tenant);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// ── DELETE /api/customers/:id
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
    .prepare(`DELETE FROM customers WHERE id = ? AND tenant_id = ?`)
    .run(id, tenant);

  if (info.changes === 0) {
    return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
