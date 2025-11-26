// app/dashboard/settings/whatsapp/page.tsx

// Sayfayı her istekte dinamik çalıştır (static/export cache devre dışı)
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: { [key: string]: string | string[] };
};

// Basit bir kart/uyarı UI'si — projendeki tasarıma göre düzenleyebilirsin
function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#fff3cd",
        color: "#664d03",
        border: "1px solid #ffecb5",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      {children}
    </div>
  );
}

export default async function WhatsappSettingsPage({ searchParams }: PageProps) {
  // URL: ?tenant=FIRMA_A gibi
  const q = searchParams?.tenant;
  const tenant = (Array.isArray(q) ? q[0] : q)?.trim() || "";

  // Tenant yoksa sadece uyarı göster
  if (!tenant) {
    return (
      <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
          WhatsApp Ayarları
        </h1>
        <Alert>
          <b>Tenant seçilmedi.</b> Lütfen URL&apos;e <code>?tenant=FIRMA_A</code>{" "}
          gibi bir parametre ekleyin.
        </Alert>
      </div>
    );
  }

  // (İsteğe bağlı) Sunucudan mevcut ayarları çekip forma doldurmak istersen:
  // Not: cache:'no-store' ile her seferinde güncel veriyi alırız
  let settings: any = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/whatsapp-settings?tenant=${encodeURIComponent(
        tenant
      )}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const json = await res.json();
      settings = json?.data ?? null;
    }
  } catch {
    // sessizce geç
  }

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
        WhatsApp Ayarları
      </h1>

      {/* Tenant başlığı */}
      <div style={{ margin: "12px 0 20px", opacity: 0.8 }}>
        Aktif tenant: <code>{tenant}</code>
      </div>

      {/* Buraya projenin gerçek form bileşenini koyabilirsin.
          Örneğin: <WhatsappSettingsForm tenant={tenant} initial={settings} /> */}
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
