// app/api/whatsapp-settings/test/route.ts
import { NextResponse } from "next/server";
import { getWhatsappSettings } from "@/lib/whatsapp-settings";

type ThinSettings = {
  accessToken?: string;
  phoneNumberId?: string;
  businessId?: string;
  verifyToken?: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const to: string = String(body?.to || "").trim();
    if (!to) {
      return NextResponse.json(
        { ok: false, error: "Parametre 'to' (E.164 tel) zorunlu." },
        { status: 400 }
      );
    }

    // (Şimdilik sabit tenant; istersen header/cookie/query'den de alabiliriz)
    const tenant = "FIRMA_A";

    const fromDb = getWhatsappSettings(tenant);

    // 🔧 null -> undefined dönüşümü ile tip uyuşmazlığını gider
    const s: ThinSettings = fromDb
      ? {
          accessToken: fromDb.accessToken,
          phoneNumberId: fromDb.phoneNumberId,
          businessId: fromDb.businessId ?? undefined,
          verifyToken: fromDb.verifyToken ?? undefined,
        }
      : {};

    if (!s.accessToken || !s.phoneNumberId) {
      return NextResponse.json(
        { ok: false, error: "WhatsApp ayarları eksik (token / phoneNumberId)." },
        { status: 400 }
      );
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";
    const url = `https://graph.facebook.com/${apiVersion}/${s.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name: "hello_world", language: { code: "en_US" } },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${s.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "API error", details: data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
