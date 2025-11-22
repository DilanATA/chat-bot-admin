// app/dashboard/settings/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default function SettingsRoot({
  searchParams,
}: {
  searchParams?: { tenant?: string };
}) {
  const qTenant = searchParams?.tenant;

  // 1) ?tenant= varsa direkt o tenant'ın settings sayfasına aktar
  if (qTenant) {
    redirect(`/dashboard/tenants/${encodeURIComponent(qTenant)}/settings`);
  }

  // 2) DB'den kayıtlı tenant'ları çek
  const rows = db.prepare("SELECT tenant FROM tenant_settings ORDER BY tenant").all() as { tenant: string }[];

  // 2a) Hiç tenant yoksa basit bir mesaj göster
  if (!rows || rows.length === 0) {
    return (
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Ayarlar</h1>
        <p>Henüz bir tenant ayarı yok. Önce bir tenant oluşturup ayar kaydedin.</p>
        <p className="text-sm text-gray-600">
          Örn: POST <code>/api/tenant/settings?tenant=FIRMA_A</code>
        </p>
      </div>
    );
  }

  // 2b) Tek tenant varsa otomatik yönlendir
  if (rows.length === 1) {
    const only = rows[0].tenant;
    redirect(`/dashboard/tenants/${encodeURIComponent(only)}/settings`);
  }

  // 2c) Birden fazla tenant varsa seçim ekranı
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ayarlar</h1>
      <p>Bir tenant seçin:</p>
      <ul className="list-disc pl-6 space-y-2">
        {rows.map((r) => (
          <li key={r.tenant}>
            <Link
              className="underline"
              href={`/dashboard/tenants/${encodeURIComponent(r.tenant)}/settings`}
            >
              {r.tenant}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
