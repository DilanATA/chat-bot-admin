"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone?: string | null;
  plate?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

const DEFAULT_TENANTS = ["FIRMA_A", "FIRMA_B", "FIRMA_C"];

export default function CustomersPage() {
  const [tenant, setTenant] = useState("");
  const [tenants, setTenants] = useState<string[]>([]);
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");

  // firma seçimi
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("tenants") || "[]");
    setTenants(stored.length ? stored : DEFAULT_TENANTS);

    const u = new URL(window.location.href);
    const fromUrl = u.searchParams.get("tenant") || "";
    const storedTenant = localStorage.getItem("tenantId") || "";
    const t = (fromUrl || storedTenant || (stored[0] ?? DEFAULT_TENANTS[0])).trim();

    setTenant(t);
    if (t) {
      u.searchParams.set("tenant", t);
      window.history.replaceState({}, "", u.toString());
      document.cookie = `tenantId=${t}; path=/; max-age=31536000`;
    }
  }, []);

  useEffect(() => {
    if (!tenant) return;
    localStorage.setItem("tenantId", tenant);
    document.cookie = `tenantId=${tenant}; path=/; max-age=31536000`;
    load();
  }, [tenant]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?tenant=${encodeURIComponent(tenant)}`, { cache: "no-store" });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      plate: plate.trim().toUpperCase() || null,
    };
    if (!payload.name) {
      alert("Müşteri adı gerekli");
      return;
    }
    const res = await fetch(`/api/customers?tenant=${encodeURIComponent(tenant)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Ekleme hatası");
      return;
    }
    setName(""); setPhone(""); setPlate("");
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Silinsin mi?")) return;
    const res = await fetch(`/api/customers/${id}?tenant=${encodeURIComponent(tenant)}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Silme hatası");
      return;
    }
    await load();
  }

  const tenantLabel = useMemo(() => tenant || "—", [tenant]);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>
        Müşteriler <span style={{ color: "#666", fontSize: 14 }}>({tenantLabel})</span>
      </h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select value={tenant} onChange={(e) => setTenant(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}>
          {tenants.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Ekleme formu */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 160px 120px", gap: 8, marginBottom: 16 }}>
        <input placeholder="Müşteri adı" value={name} onChange={(e) => setName(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
        <input placeholder="Telefon (ops.)" value={phone} onChange={(e) => setPhone(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
        <input placeholder="Plaka (ops.)" value={plate} onChange={(e) => setPlate(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd", textTransform: "uppercase" }} />
        <button onClick={add} style={{ border: "none", borderRadius: 8, background: "#111", color: "#fff" }}>Ekle</button>
      </div>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : list.length === 0 ? (
        <div style={{ color: "#777" }}>Henüz kayıt yok. Yukarıdan ekleyebilirsin.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 8, width: 80 }}>ID</th>
              <th style={{ padding: 8 }}>Ad</th>
              <th style={{ padding: 8, width: 160 }}>Telefon</th>
              <th style={{ padding: 8, width: 140 }}>Plaka</th>
              <th style={{ padding: 8, width: 120 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
                <td style={{ padding: 8 }}>{c.id}</td>
                <td style={{ padding: 8 }}>{c.name}</td>
                <td style={{ padding: 8 }}>{c.phone ?? "—"}</td>
                <td style={{ padding: 8 }}>{c.plate ?? "—"}</td>
                <td style={{ padding: 8 }}>
                  <button onClick={() => remove(c.id)} style={{ border: "none", borderRadius: 6, padding: "6px 10px", background: "#d33", color: "#fff" }}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
