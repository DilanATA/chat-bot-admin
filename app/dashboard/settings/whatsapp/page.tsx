"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string | null;
  verifyToken?: string | null;
};

function WhatsappSettingsInner() {
  const searchParams = useSearchParams();
  const [tenant, setTenant] = useState<string | null>(null);
  const [settings, setSettings] = useState<WhatsappSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const t = searchParams.get("tenant");
    setTenant(t);

    if (t) {
      fetch(`/api/whatsapp-settings?tenant=${encodeURIComponent(t)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => setSettings(json?.data ?? null))
        .catch(() => {});
    }
  }, [searchParams]);

  async function handleSave() {
    if (!tenant || !settings) return;
    setSaving(true);
    setSaved(false);

    const res = await fetch(`/api/whatsapp-settings?tenant=${tenant}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

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

      <p style={{ opacity: 0.8 }}>Aktif tenant: <code>{tenant}</code></p>

      <div
        style={{
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          padding: 16,
          background: "#111418",
          color: "#fff",
        }}
      >
        {!settings ? (
          <p>Yükleniyor...</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            {[
              { key: "accessToken", label: "Access Token" },
              { key: "phoneNumberId", label: "Phone Number ID" },
              { key: "businessId", label: "Business ID" },
              { key: "verifyToken", label: "Verify Token" },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 4,
                    fontSize: 14,
                  }}
                >
                  {f.label}
                </label>
                <input
                  type="text"
                  value={(settings as any)[f.key] || ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      [f.key]: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #333",
                    background: "#0b0e12",
                    color: "#fff",
                  }}
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving ? "#555" : "#0d6efd",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>

            {saved && (
              <span style={{ marginLeft: 12, color: "#28a745" }}>
                ✅ Kaydedildi
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default function WhatsappSettingsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Yükleniyor...</div>}>
      <WhatsappSettingsInner />
    </Suspense>
  );
}
