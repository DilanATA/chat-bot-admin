import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenantIdFromSession } from "@/lib/auth";
import { getWhatsappSettings, WhatsappSettings } from "@/lib/whatsapp-settings";

type SendBody = {
  // zorunlu
  to?: string; // +905xxxxxxxxx
  // opsiyonel içerik
  text?: string;
  type?: "text" | "template";
  templateName?: string;       // default: "hello_world"
  templateLanguage?: string;   // default: "en_US"
  // opsiyonel: tenant & settings override
  tenant?: string;
  settings?: Partial<WhatsappSettings>;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendBody;

    // 1) Alıcı
    const to = body.to?.trim();
    if (!to) {
      return NextResponse.json({ ok: false, error: "'to' gerekli (+90...)" }, { status: 400 });
    }

    // 2) Tenant
    const tenantFromSession = await getTenantIdFromSession(req); // "FIRMA_A" gibi string
    const tenant = (body.tenant ?? tenantFromSession)?.trim();
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "Tenant bulunamadı" }, { status: 401 });
    }

    // 3) Ayarlar (önce body.settings override, yoksa DB)
    let settings: WhatsappSettings | null = null;

    if (body.settings?.accessToken && body.settings?.phoneNumberId) {
      settings = {
        accessToken: body.settings.accessToken,
        phoneNumberId: body.settings.phoneNumberId,
        businessId: body.settings.businessId ?? "",
        verifyToken: body.settings.verifyToken ?? "",
      };
    } else {
      const fromDb = getWhatsappSettings(tenant);
      if (!fromDb) {
        return NextResponse.json(
          { ok: false, error: "WhatsApp ayarları bulunamadı (tenant için kaydetmelisiniz)" },
          { status: 400 }
        );
      }
      settings = fromDb;
    }

    const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";
    const url = `https://graph.facebook.com/${apiVersion}/${settings.phoneNumberId}/messages`;

    // 4) Payload — ilk temas için template, pencere içiyse text
    const useTemplate = body.type === "template" || (!body.type && !body.text);
    const templateName = body.templateName?.trim() || "hello_world";
    const templateLanguage = body.templateLanguage?.trim() || "en_US";
    const textBody = (body.text ?? "Test message from your reminder system ✅").slice(0, 4096);

    const payload = useTemplate
      ? {
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: { name: templateName, language: { code: templateLanguage } },
        }
      : {
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: textBody },
        };

    // 5) Gönder
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    // 6) Log kaydı
    try {
      const messageId =
        data?.messages?.[0]?.id ??
        data?.message_id ??
        (Array.isArray(data) ? data[0]?.id : null);

      db.prepare(
        `INSERT INTO message_logs (tenant, phone, message_id, status, timestamp)
         VALUES (@tenant, @phone, @message_id, @status, @ts)`
      ).run({
        tenant,
        phone: to,
        message_id: messageId ?? "",
        status: res.ok ? "SENT" : "ERROR",
        ts: Math.floor(Date.now() / 1000),
      });
    } catch (e) {
      console.error("message_logs insert error:", e);
    }

    if (!res.ok) {
      // Token expired (190/463)
      const expired = data?.error?.code === 190 || data?.error?.error_subcode === 463;
      if (expired) {
        return NextResponse.json(
          { ok: false, error: "Access token expired. Meta'dan yeni token alın." },
          { status: 401 }
        );
      }
      return NextResponse.json({ ok: false, error: "API error", details: data }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    console.error("whatsapp send error:", e);
    return NextResponse.json(
      { ok: false, error: "Unexpected error", message: e?.message },
      { status: 500 }
    );
  }
}
