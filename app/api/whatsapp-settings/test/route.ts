import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth";
import { getWhatsappSettings } from "@/lib/whatsapp-settings";

type Body = {
  to?: string;
  // UI'dan geliyorsa buraya formdaki değerleri ekliyoruz (opsiyonel)
  settings?: {
    accessToken?: string;
    phoneNumberId?: string;
    businessId?: string;
    verifyToken?: string;
  };
};

export async function POST(req: NextRequest) {
  const tenant = await getTenantIdFromSession(req); // "FIRMA_A" gibi string bekliyoruz
  const body = (await req.json()) as Body;

  const to = body.to?.trim();
  if (!to) {
    return NextResponse.json(
      { ok: false, error: "'to' (alıcı) gerekli" },
      { status: 400 }
    );
  }

  // 1) Öncelik: client'tan gelen ayarlar
  let s = body.settings;

  // 2) Yoksa DB'den çek
  if (!s?.accessToken || !s?.phoneNumberId) {
    if (!tenant) {
      return NextResponse.json(
        { ok: false, error: "Tenant bulunamadı" },
        { status: 401 }
      );
    }
    const fromDb = getWhatsappSettings(tenant);
    if (!fromDb) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp ayarları bulunamadı" },
        { status: 400 }
      );
    }
    s = fromDb;
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const url = `https://graph.facebook.com/${apiVersion}/${s.phoneNumberId}/messages`;

  // 🔴 İLK MESAJ için her zaman TEMPLATE kullan (hello_world)
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: "hello_world",
      language: { code: "en_US" }
    }
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${s.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // Debug log (sunucu konsolunda göreceksin)
    console.log("➡️ META REQ URL:", url);
    console.log("➡️ META REQ BODY:", payload);
    console.log("⬅️ META RES STATUS:", res.status);
    console.log("⬅️ META RES BODY:", data);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: "API error", details: data },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    console.error("WhatsApp test error", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected error", message: e?.message },
      { status: 500 }
    );
  }
}
