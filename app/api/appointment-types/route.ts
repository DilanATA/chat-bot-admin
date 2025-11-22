import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantIdFromSession } from "@/lib/auth";

// LISTE + EKLE
export async function GET(req: NextRequest) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const list = db
    .prepare(
      `
      SELECT
        id,
        name,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM appointment_types
      WHERE tenant_id = ? AND name LIKE ?
      ORDER BY id ASC
      `
    )
    .all(tenantId, `%${q}%`);

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const tenantId = await getTenantIdFromSession(req);
  if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = String(body?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const info = db
      .prepare(
        `
        INSERT INTO appointment_types (tenant_id, name)
        VALUES (?, ?)
        `
      )
      .run(tenantId, name);

    const row = db
      .prepare(
        `
        SELECT id, name, created_at AS createdAt, updated_at AS updatedAt
        FROM appointment_types
        WHERE tenant_id = ? AND id = ?
        `
      )
      .get(tenantId, info.lastInsertRowid as number);

    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    // UNIQUE(tenant_id, name) ihlali vs.
    if (String(e?.message || "").includes("UNIQUE")) {
      return NextResponse.json({ error: "Bu firmada aynı isim zaten var" }, { status: 409 });
    }
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}
