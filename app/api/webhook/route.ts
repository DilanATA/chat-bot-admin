export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// DB'den verify_token arayıp ilgili tenant'ı bul
function getTenantByVerifyToken(token: string): string | null {
  const row = db
    .prepare(
      `SELECT tenant FROM tenant_whatsapp_settings WHERE verify_token = ? LIMIT 1`
    )
    .get(token) as { tenant: string } | undefined;
  return row?.tenant ?? null;
}

// Belirli tenant için verify_token'ı getir
function getVerifyTokenForTenant(tenant: string): string | null {
  const row = db
    .prepare(
      `SELECT verify_token FROM tenant_whatsapp_settings WHERE tenant = ? LIMIT 1`
    )
    .get(tenant) as { verify_token: string } | undefined;
  return row?.verify_token ?? null;
}

// ———————————————————————
// 1) GET: Meta webhook doğrulaması
// ———————————————————————
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const verifyTokenFromMeta = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const tenantFromQuery = url.searchParams.get("tenant") ?? ""; // opsiyonel

  if (mode !== "subscribe" || !verifyTokenFromMeta || !challenge) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // Öncelik: ?tenant=FIRMA_A verilmişse onun verify_token'ını kontrol et
  let expected = tenantFromQuery
    ? getVerifyTokenForTenant(tenantFromQuery)
    : null;

  // Yoksa verify_token üzerinden ilgili tenant'ı bul (çok-tenant webhook URL'i için)
  if (!expected) {
    const tenant = getTenantByVerifyToken(verifyTokenFromMeta);
    if (!tenant) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    expected = getVerifyTokenForTenant(tenant);
  }

  if (verifyTokenFromMeta !== expected) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Meta, challenge string'ini body olarak bekler
  return new NextResponse(challenge, { status: 200 });
}

// ———————————————————————
// 2) POST: Event akışı (inbound mesajlar, status vb.)
// ———————————————————————
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as any;

    // Basit loglama
    db.prepare(
      `INSERT INTO audit_logs (tenant, action, details, created_at)
       VALUES (@tenant, @action, @details, @ts)`
    ).run({
      tenant: extractTenantFromBody(body), // aşağıda küçük helper ile
      action: "whatsapp_webhook_event",
      details: JSON.stringify(body).slice(0, 900000), // güvenli sınır
      ts: Math.floor(Date.now() / 1000),
    });

    // İstersen burada "message_logs" veya kendi tablona "status" kayıtları da yaz:
    // - inbound text: entry.changes[].value.messages[].type === "text"
    // - status: entry.changes[].value.statuses[] (delivered, read vs.)

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook POST error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// Webhook body içinden tenant'ı sezme (businessId -> tenant eşleşmesi ekleyebilirsin)
function extractTenantFromBody(body: any): string {
  try {
    const bizId =
      body?.entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number ??
      body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ??
      "";
    // Basitçe phone_number_id ile tenant eşleştirmek istersen:
    const row = db
      .prepare(
        `SELECT tenant FROM tenant_whatsapp_settings WHERE phone_number_id = ? LIMIT 1`
      )
      .get(bizId) as { tenant: string } | undefined;
    return row?.tenant ?? "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}
