// app/dashboard/settings/whatsapp/page.tsx
import "server-only";
import React from "react";
import { cookies } from "next/headers";

type SettingsData = {
  accessToken?: string | null;
  phoneNumberId?: string | null;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null; // null gelebilir - bu hata değildir!
};

function getTenant(searchParams: { [k: string]: string | string[] | undefined }) {
  const sp = searchParams?.tenant;
  const fromQuery = Array.isArray(sp) ? sp[0] : sp;
  const fromCookie = cookies().get("tenantId")?.value;
  return (fromQuery || fromCookie || "").trim() || null;
}

export default async function WhatsappSettingsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const tenant = getTenant(searchParams);

  // Tenant yoksa uyarı verelim (UI hata gibi davranmasın).
  if (!tenant) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-3">WhatsApp Ayarları</h1>
        <div className="rounded-md bg-yellow-100 text-yellow-900 p-4">
          Tenant seçilmedi. URL’e <code>?tenant=FIRMA_A</code> gibi bir parametre ekleyin.
        </div>
      </div>
    );
  }

  // API'den ayarları çekiyoruz. (cache:no-store => her defasında güncel)
  let ok = false;
  let data: SettingsData | null = null;
  let loadError: string | null = null;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/whatsapp-settings?tenant=${encodeURIComponent(
        tenant
      )}`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      // HTTP seviyesinde hata
      loadError = `Ayarlar okunamadı (HTTP ${res.status}).`;
    } else {
      const json = (await res.json()) as { ok: boolean; data?: SettingsData; error?: any };
      ok = json.ok === true;
      data = json.data ?? null;

      if (!ok) {
        // API ok:false döndüyse gerçek mesajı göster
        loadError = typeof json.error === "string" ? json.error : JSON.stringify(json.error);
      }
    }
  } catch (e: any) {
    loadError = e?.message || String(e);
  }

  // NOT: webhookUrl null olabilir; bu "hata" değildir. Sadece Meta’da Verify&Save yapılmamıştır.
  // Bu yüzden ok===true ise Uİ’de "hata" gösterME!
  const initial = {
    accessToken: data?.accessToken ?? "",
    phoneNumberId: data?.phoneNumberId ?? "",
    businessId: data?.businessId ?? "",
    verifyToken: data?.verifyToken ?? "",
    webhookUrl: data?.webhookUrl ?? "", // null ise boş string
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">WhatsApp Ayarları</h1>

      {/* Sadece ok=false ise hata bandı göster */}
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
        <Field label="Webhook URL" value={initial.webhookUrl} readOnly helper="Meta Developer panelinde 'Verify and save' yaptıktan sonra dolacaktır. Boş olması hata değildir." />
      </div>

      <div className="rounded-md bg-blue-50 text-blue-900 p-4 max-w-3xl">
        <div className="font-medium mb-1">Hızlı Kontrol</div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <code>/api/webhook?hub.mode=subscribe&amp;hub.verify_token=...&amp;hub.challenge=9999</code>{" "}
            çağrısı  <b>9999</b> döndürüyorsa webhook doğrulaması hazır demektir.
          </li>
          <li>
            Test gönderimi için endpoint:{" "}
            <code>/api/whatsapp-settings/test?tenant={tenant}</code>
          </li>
          <li>Bu sayfa sadece ayarları okur. Kaydetme/düzenleme Uİ’si sizde ayrı bir komponentse onu kullanmaya devam edin.</li>
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
