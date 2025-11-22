import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

/** tenantId'yi ?tenant=… veya cookie'den oku */
function getTenant(req: NextRequest): string | null {
  const url = new URL(req.url);
  const t = url.searchParams.get("tenant") || req.cookies.get("tenantId")?.value || "";
  return t.trim() || null;
}

type Row = {
  id: number;
  customerId: number;
  typeId: number;
  startAt: string;
  endAt?: string | null;
  status: string;
  note?: string | null;
  customerName?: string | null;
  typeName?: string | null;
};

export async function GET(req: NextRequest) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  const rows: Row[] = db
    .prepare(
      `
      SELECT
        a.id,
        a.customer_id AS customerId,
        a.type_id     AS typeId,
        a.start_at    AS startAt,
        a.end_at      AS endAt,
        a.status,
        a.note,
        c.name        AS customerName,
        t.name        AS typeName
      FROM appointments a
      LEFT JOIN customers c
        ON c.id = a.customer_id AND c.tenant_id = a.tenant_id
      LEFT JOIN appointment_types t
        ON t.id = a.type_id AND t.tenant_id = a.tenant_id
      WHERE a.tenant_id = ?
        AND (? = '' OR a.note LIKE ?)
      ORDER BY a.start_at DESC
    `
    )
    .all(tenant, q, `%${q}%`) as any;

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const tenant = getTenant(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const customerId = Number.parseInt(String(body.customerId ?? ""), 10);
  const typeId     = Number.parseInt(String(body.typeId ?? ""), 10);
  const startAt    = String(body.startAt ?? "").trim();
  const endAt      = (body.endAt ? String(body.endAt).trim() : null) || null;
  const status     = String(body.status ?? "scheduled").trim();
  const note       = (body.note ? String(body.note).trim() : null) || null;

  if (!Number.isInteger(customerId) || customerId <= 0)
    return NextResponse.json({ error: "Geçersiz müşteri" }, { status: 400 });
  if (!Number.isInteger(typeId) || typeId <= 0)
    return NextResponse.json({ error: "Geçersiz tip" }, { status: 400 });
  if (!startAt)
    return NextResponse.json({ error: "Başlangıç tarihi gerekli" }, { status: 400 });
  if (!["scheduled", "completed", "canceled"].includes(status))
    return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });

  // Müşteri & tip bu tenant’a ait mi?
  const okCustomer = db.prepare(
    `SELECT 1 FROM customers WHERE id = ? AND tenant_id = ? LIMIT 1`
  ).get(customerId, tenant);
  if (!okCustomer) return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });

  const okType = db.prepare(
    `SELECT 1 FROM appointment_types WHERE id = ? AND tenant_id = ? LIMIT 1`
  ).get(typeId, tenant);
  if (!okType) return NextResponse.json({ error: "Randevu tipi bulunamadı" }, { status: 404 });

  const res = db
    .prepare(
      `INSERT INTO appointments
       (tenant_id, customer_id, type_id, start_at, end_at, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(tenant, customerId, typeId, startAt, endAt, status, note);

  return NextResponse.json(
    { id: Number(res.lastInsertRowid) },
    { status: 201 }
  );
}
