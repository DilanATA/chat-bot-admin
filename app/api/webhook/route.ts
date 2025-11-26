// app/api/webhook/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // kesin dinamik

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") ?? "0";

  const expected =
    process.env.WEBHOOK_VERIFY_TOKEN ||
    process.env.WHATSAPP_VERIFY_TOKEN ||
    "dev-verify-token";

  if (mode === "subscribe" && token === expected) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 403 });
}

export async function POST() {
  // Meta, mesaj/ack eventlerini buraya POST eder
  return NextResponse.json({ ok: true });
}
