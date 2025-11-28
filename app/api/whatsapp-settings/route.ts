export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  getWhatsappSettings,
  upsertWhatsappSettings,
  WhatsappSettings,
} from "@/lib/whatsapp-settings";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenant = searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
    }

    const settings = getWhatsappSettings(tenant);
    return NextResponse.json({ ok: true, data: settings ?? null });
  } catch (err) {
    console.error("❌ [GET /whatsapp-settings] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenant = searchParams.get("tenant");

    if (!tenant) {
      return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
    }

    const body = (await req.json()) as Partial<WhatsappSettings>;

    console.log("📦 POST body:", body);

    const cleaned: WhatsappSettings = {
      accessToken: (body.accessToken ?? "").trim(),
      phoneNumberId: (body.phoneNumberId ?? "").trim(),
      businessId: (body.businessId ?? "").trim(),
      verifyToken: (body.verifyToken ?? "").trim(),
      webhookUrl: (body.webhookUrl ?? "").trim(),
    };

    console.log("💾 Saving tenant:", tenant, cleaned);

    upsertWhatsappSettings(tenant, cleaned);

    console.log("✅ Saved successfully!");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ [POST /whatsapp-settings] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
