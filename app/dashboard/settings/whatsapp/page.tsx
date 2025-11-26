"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function WhatsappSettingsInner() {
  const searchParams = useSearchParams();
  const [tenant, setTenant] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const t = searchParams.get("tenant");
    setTenant(t);

    if (t) {
      fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/whatsapp-settings?tenant=${encodeURIComponent(
          t
        )}`,
        { cache: "no-store" }
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setSettings(json?.data ?? null))
        .catch(() => {});
    }
  }, [searchParams]);

  if (!tenant) {
    return (
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          WhatsApp Ayarları
        </h1>
        <div
          style={{
            background: "#fff3cd",
            color: "#664d03",
            border: "1px solid #ffecb5",
            borderRadius: 8,
            padding: "14px 16px",
          }}
        >
          <b>Tenant seçilmedi.</b> Lütfen URL&apos;e{" "}
          <code>?tenant=FIRMA_A</code> gibi bir parametre ekleyin.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        WhatsApp Ayarları
      </h1>
      <div style={{ margin: "12px 0 20px", opacity: 0.8 }}>
        Aktif tenant: <code>{tenant}</code>
      </div>

      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          background: "#111418",
        }}
      >
        <p style={{ margin: 0, opacity: 0.9 }}>
          Form bileşenini burada render edin. İstersen geçici olarak
          ayarları gösteriyorum:
        </p>

        <pre
          style={{
            marginTop: 12,
            background: "#0b0e12",
            padding: 12,
            borderRadius: 8,
            overflow: "auto",
          }}
        >
{JSON.stringify({ tenant, settings }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ✅ Suspense boundary ekliyoruz
export default function WhatsappSettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Yükleniyor...</div>}>
      <WhatsappSettingsInner />
    </Suspense>
  );
}
