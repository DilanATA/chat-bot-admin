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
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");

  if (!tenant) {
    return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
  }

  const settings = getWhatsappSettings(tenant);
  return NextResponse.json({ ok: true, data: settings ?? null });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenant = searchParams.get("tenant");

  if (!tenant) {
    return NextResponse.json({ error: "Missing tenant parameter" }, { status: 400 });
  }

  const body = (await req.json()) as Partial<WhatsappSettings>;
  const cleaned: WhatsappSettings = {
    accessToken: (body.accessToken ?? "").trim(),
    phoneNumberId: (body.phoneNumberId ?? "").trim(),
    businessId: (body.businessId ?? "").trim(),
    verifyToken: (body.verifyToken ?? "").trim(),
  };

  upsertWhatsappSettings(tenant, cleaned);
  return NextResponse.json({ ok: true });
}
