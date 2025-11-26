import { NextRequest, NextResponse } from "next/server";
import { getTenantIdFromSession } from "@/lib/auth"; // bu fonksiyon string döndürüyorsa sorun yok
import {
  getWhatsappSettings,
  upsertWhatsappSettings,
  WhatsappSettings,
} from "@/lib/whatsapp-settings";

export async function GET(req: NextRequest) {
  const tenant = await getTenantIdFromSession(req); // string bekliyoruz: "FIRMA_A"
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = getWhatsappSettings(tenant);
  return NextResponse.json({ ok: true, data: settings });
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantIdFromSession(req);
  if (!tenant) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
