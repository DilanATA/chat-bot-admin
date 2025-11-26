"use client";

import { useEffect, useState } from "react";

type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId: string;
  verifyToken: string;
};

export default function WhatsappSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [values, setValues] = useState<WhatsappSettings>({
    accessToken: "",
    phoneNumberId: "",
    businessId: "",
    verifyToken: "",
  });

  // Mevcut sayfadaki tüm query string'i (tenant=FIRMA_A gibi) her isteğe eklemek için:
  const qs =
    typeof window !== "undefined" && window.location.search
      ? window.location.search
      : "";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/whatsapp-settings${qs}`);
        const json = await res.json();
        if (json?.data) {
          setValues({
            accessToken: json.data.accessToken ?? "",
            phoneNumberId: json.data.phoneNumberId ?? "",
            businessId: json.data.businessId ?? "",
            verifyToken: json.data.verifyToken ?? "",
          });
        }
      } catch (e) {
        console.error("Load settings error:", e);
        alert("WhatsApp ayarları yüklenirken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ilk renderda yüklensin

  const handleChange =
    (field: keyof WhatsappSettings) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/whatsapp-settings${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Save failed");
      }
      alert("Kaydedildi ✅");
    } catch (e) {
      console.error(e);
      alert("Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testTo.trim()) {
      alert("Test için telefon numarası gir (+905xx...)");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(`/api/whatsapp-settings/test${qs}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        console.error("TEST RESP:", json);
        alert("Test başarısız. Token/numara/izinleri kontrol et.");
        return;
      }
      alert("Test mesajı gönderildi 🎉");
    } catch (e) {
      console.error(e);
      alert("Test sırasında beklenmeyen hata.");
    } finally {
      setTesting(false);
    }
  };

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook`
      : "";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">WhatsApp Ayarları</h1>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
        <h2 className="mb-4 text-lg font-semibold">API Bilgileri</h2>

        {loading ? (
          <div>Yükleniyor...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Access Token</label>
              <input
                type="password"
                value={values.accessToken}
                onChange={handleChange("accessToken")}
                placeholder="EAAG..."
                className="w-full rounded border border-gray-600 bg-gray-900 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Phone Number ID</label>
              <input
                value={values.phoneNumberId}
                onChange={handleChange("phoneNumberId")}
                placeholder="123456789012345"
                className="w-full rounded border border-gray-600 bg-gray-900 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Business Account ID</label>
              <input
                value={values.businessId}
                onChange={handleChange("businessId")}
                placeholder="123456789012345"
                className="w-full rounded border border-gray-600 bg-gray-900 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Verify Token (Webhook)</label>
              <input
                value={values.verifyToken}
                onChange={handleChange("verifyToken")}
                placeholder="secret-verify-token"
                className="w-full rounded border border-gray-600 bg-gray-900 p-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Webhook URL</label>
              <div className="rounded border border-gray-600 bg-gray-900 p-2 text-sm">
                {webhookUrl}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Bu adresi Meta Developer panelinde webhook URL’i olarak kullan.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>

              <input
                className="w-48 rounded border border-gray-600 bg-gray-900 p-2"
                placeholder="+905xxxxxxxxx"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <button
                onClick={handleTest}
                disabled={testing || loading}
                className="rounded border border-gray-500 px-4 py-2 hover:bg-gray-700 disabled:opacity-60"
              >
                {testing ? "Test Gönderiliyor..." : "Test Mesajı Gönder"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
