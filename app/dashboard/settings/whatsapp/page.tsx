// app/dashboard/settings/whatsapp/page.tsx
import "server-only";
import React from "react";

type SettingsData = {
  accessToken?: string | null;
  phoneNumberId?: string | null;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null;
};

export default async function WhatsappSettingsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const sp = searchParams?.tenant;
  const tenant = (Array.isArray(sp) ? sp[0] : sp) ?? "";

  if (!tenant.trim()) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">WhatsApp Ayarları</h1>
        <div className="rounded-md bg-yellow-100 text-yellow-900 p-4">
          Tenant seçilmedi. URL’e <code>?tenant=FIRMA_A</code> gibi bir parametre ekleyin.
        </div>
      </div>
    );
  }

  let ok = false;
  let data: SettingsData | null = null;
  let loadError: string | null = null;

  try {
    // Server Component’te relative fetch kullanabiliriz
    const res = await fetch(
      `/api/whatsapp-settings?tenant=${encodeURIComponent(tenant)}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      loadError = `Ayarlar okunamadı (HTTP ${res.status}).`;
    } else {
      const json = (await res.json()) as { ok: boolean; data?: SettingsData; error?: any };
      ok = json.ok === true;
      data = json.data ?? null;
      if (!ok) {
        loadError = typeof json.error === "string" ? json.error : JSON.stringify(json.error);
      }
    }
  } catch (e: any) {
    loadError = e?.message || String(e);
  }

  const initial = {
    accessToken: data?.accessToken ?? "",
    phoneNumberId: data?.phoneNumberId ?? "",
    businessId: data?.businessId ?? "",
    verifyToken: data?.verifyToken ?? "",
    webhookUrl: data?.webhookUrl ?? "",
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">WhatsApp Ayarları</h1>

      {!ok && loadError && (
        <div className="rounded-md bg-red-100 text-red-900 p-4">
          WhatsApp ayarları yüklenirken hata oluştu: <b>{loadError}</b>
        </div>
      )}

      <div className="grid gap-4 max-w-3xl">
        <Field label="Access Token" value={initial.accessToken} readOnly />
        <Field label="Phone Number ID" value={initial.phoneNumberId} readOnly />
        <Field label="Business Account ID" value={initial.businessId} readOnly />
        <Field label="Verify Token (Webhook)" value={initial.verifyToken} readOnly />
        <Field
          label="Webhook URL"
          value={initial.webhookUrl}
          readOnly
          helper="Meta'da Verify & Save yapılmadıysa boş olabilir; bu bir hata değildir."
        />
      </div>

      <div className="rounded-md bg-blue-50 text-blue-900 p-4 max-w-3xl">
        <div className="font-medium mb-1">Hızlı Kontrol</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <code>/api/webhook?hub.mode=subscribe&amp;hub.verify_token=...&amp;hub.challenge=9999</code>{" "}
            çağrısı  <b>9999</b> döndürüyor mu?
          </li>
          <li>
            Test için endpoint: <code>/api/whatsapp-settings/test?tenant={tenant}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  readOnly,
  helper,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
  helper?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-500">{label}</label>
      <input
        className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
        value={value}
        readOnly={readOnly}
      />
      {helper ? <p className="text-xs text-gray-500">{helper}</p> : null}
    </div>
  );
}
