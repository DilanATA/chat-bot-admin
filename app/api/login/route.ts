import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = body.password as string | undefined;

    const adminPass = process.env.ADMIN_PASS;

    console.log("🔐 LOGIN API ÇAĞRILDI");
    console.log("📦 ENV ADMIN_PASS:", adminPass);
    console.log("📨 Gelen password:", password);
    console.log("🔍 SERVER ENV:", process.env.ADMIN_PASS);

    if (!adminPass) {
      console.error("❌ ADMIN_PASS env tanımlı değil!");
      return NextResponse.json(
        { ok: false, error: "Server config missing" },
        { status: 500 }
      );
    }

    if (password && password === adminPass) {
      console.log("✅ Şifre doğru, giriş başarılı");
      return NextResponse.json({ ok: true });
    }

    console.log("⚠️ Şifre yanlış");
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch (e) {
    console.error("❌ Login API error:", e);
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 }
    );
  }
}
