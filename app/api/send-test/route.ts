import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, plate, dateRaw } = body;

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "'phone' gerekli" },
        { status: 400 }
      );
    }

    // İçeriden /api/whatsapp'a proxy et
    const origin =
      process.env.NEXT_PUBLIC_API_URL || new URL(req.url).origin;

    const templateName =
      process.env.WA_TEMPLATE_NAME?.trim() || "hello_world";
    const templateLanguage =
      process.env.WA_TEMPLATE_LANG?.trim() || "en_US";

    // İlk temas için template gönderiyoruz
    const res = await fetch(`${origin}/api/whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: String(phone).trim(),
        type: "template",
        templateName,
        templateLanguage,
        // isterseniz içerik/log amaçlı metadata da gönderebilirsiniz:
        // tenant, name, plate, dateRaw ...
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return NextResponse.json(
        { ok: false, error: "send-test failed", details: data },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
