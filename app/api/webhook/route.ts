// app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { openDb } from "@/lib/migrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge") ?? "0";

    // 🧱 Render build sırasında DB erişimini engelle
    if (
      process.env.NEXT_PHASE === "build" ||
      (process.env.NODE_ENV === "production" &&
        process.env.RENDER === "true" &&
        !process.env.RUNTIME)
    ) {
      console.log("⛔ Skipping DB access during build");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const db = openDb();
    const row = db
      .prepare("SELECT verify_token FROM tenant_whatsapp_settings LIMIT 1")
      .get();

    const expected =
      row?.verify_token ||
      process.env.WABA_VERIFY_TOKEN ||
      process.env.WEBHOOK_VERIFY_TOKEN ||
      process.env.WHATSAPP_VERIFY_TOKEN ||
      "dev-verify-token";
    console.log("🔑 Expected verify token:", expected);
    console.log("🧩 Incoming token:", token);

    if (mode === "subscribe" && token === expected) {
      console.log("✅ Webhook doğrulandı!");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn(
      `❌ Webhook doğrulama başarısız. Beklenen: ${expected}, gelen: ${token}`
    );
    return NextResponse.json(
      { ok: false, error: "Verification failed" },
      { status: 403 }
    );
  } catch (err) {
    console.error("❌ [GET /webhook] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📩 Gelen Webhook:", JSON.stringify(body, null, 2));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ [POST /webhook] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
