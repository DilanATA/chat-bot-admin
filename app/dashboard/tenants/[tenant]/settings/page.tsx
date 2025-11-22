// app/dashboard/tenants/[tenant]/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

type Settings = {
  sheet_id: string;
  sheet_name: string;
  date_col: number;
  phone_col: number;
  plate_col: number;
  status_col: number;
};

export default function TenantSettingsPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState<Settings>({
    sheet_id: "",
    sheet_name: "Sayfa1",
    date_col: 4,
    phone_col: 3,
    plate_col: 1,
    status_col: 5,
  });

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tenant/settings?tenant=${tenant}`);
        const json = await res.json();
        if (json?.data) {
          const { sheet_id, sheet_name, date_col, phone_col, plate_col, status_col } = json.data;
          setForm({ sheet_id, sheet_name, date_col, phone_col, plate_col, status_col });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [tenant]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/tenant/settings?tenant=${tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json?.ok) setMsg("✅ Kaydedildi");
      else setMsg("❌ Hata: " + (json?.error || "Bilinmeyen hata"));
    } catch (e: any) {
      setMsg("❌ Hata: " + e?.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof Settings, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Tenant Settings: {tenant}</h1>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Spreadsheet ID</label>
            <input
              className="w-full border rounded p-2"
              value={form.sheet_id}
              onChange={(e) => set("sheet_id", e.target.value)}
              placeholder="1AbcDEF..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Sheet Name</label>
              <input
                className="w-full border rounded p-2"
                value={form.sheet_name}
                onChange={(e) => set("sheet_name", e.target.value)}
                placeholder="Sayfa1"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Plate Column</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={form.plate_col}
                onChange={(e) => set("plate_col", Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Phone Column</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={form.phone_col}
                onChange={(e) => set("phone_col", Number(e.target.value))}
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date Column</label>
              <input
                type="number"
                className="w-full border rounded p-2"
                value={form.date_col}
                onChange={(e) => set("date_col", Number(e.target.value))}
                min={1}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Status Column</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={form.status_col}
              onChange={(e) => set("status_col", Number(e.target.value))}
              min={1}
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-black text-white"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>

          {msg && <div className="text-sm">{msg}</div>}
        </form>
      )}
    </div>
  );
}
