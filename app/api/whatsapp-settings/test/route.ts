// app/api/whatsapp-settings/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getTenant(req: NextRequest) {
  const url = new URL(req.url);
  return (url.searchParams.get("tenant") || req.cookies.get("tenantId")?.value || "").trim() || null;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = getTenant(req);
    if (!tenant) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { to, templateName = "hello_world", templateLanguage = "en_US" } = await req.json();

    const row = db.prepare(`
      SELECT access_token as accessToken,
             phone_number_id as phoneNumberId
      FROM tenant_whatsapp_settings
      WHERE tenant_id = ?
      LIMIT 1
    `).get(tenant) as { accessToken?: string; phoneNumberId?: string } | undefined;

    if (!row?.accessToken || !row?.phoneNumberId) {
      return NextResponse.json({ ok: false, error: "WhatsApp ayarları eksik (token / phoneNumberId)." }, { status: 400 });
    }

    const url = `https://graph.facebook.com/v21.0/${row.phoneNumberId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLanguage },
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${row.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: data || "Graph API error" }, { status: res.status });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
