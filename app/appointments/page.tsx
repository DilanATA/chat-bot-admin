"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = { id: number; name: string };
type TypeItem = { id: number; name: string };
type Row = {
  id: number;
  customerId: number;
  typeId: number;
  startAt: string;
  endAt?: string | null;
  status: string;
  note?: string | null;
  customerName?: string;
  typeName?: string;
};

const DEFAULT_TENANTS = ["FIRMA_A", "FIRMA_B", "FIRMA_C"];

export default function AppointmentsPage() {
  const [tenant, setTenant] = useState("");
  const [tenants, setTenants] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [types, setTypes] = useState<TypeItem[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [typeId, setTypeId] = useState<number | "">("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [note, setNote] = useState("");

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
      const [custRes, typeRes, apptRes] = await Promise.all([
        fetch(`/api/customers?tenant=${tenant}`, { cache: "no-store" }),
        fetch(`/api/appointment-types?tenant=${tenant}`, { cache: "no-store" }),
        fetch(`/api/appointments?tenant=${tenant}`, { cache: "no-store" }),
      ]);
      setCustomers(await custRes.json());
      setTypes(await typeRes.json());
      setRows(await apptRes.json());
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    if (!customerId || !typeId || !startAt) {
      alert("Müşteri, tip ve başlangıç tarihi zorunlu.");
      return;
    }
    const res = await fetch(`/api/appointments?tenant=${tenant}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId, typeId, startAt,
        endAt: endAt || null, status, note: note || null
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Ekleme hatası");
      return;
    }
    setCustomerId(""); setTypeId(""); setStartAt(""); setEndAt(""); setStatus("scheduled"); setNote("");
    await load();
  }

  const tenantLabel = useMemo(() => tenant || "—", [tenant]);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>
        Randevular <span style={{ color: "#666", fontSize: 14 }}>({tenantLabel})</span>
      </h1>

      {/* firma */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={tenant} onChange={(e) => setTenant(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #ddd" }}>
          {tenants.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ekleme barı */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 220px 220px 220px 160px 1fr 90px", gap: 8, marginBottom: 16 }}>
        <select value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          <option value="">Müşteri (ID - Ad)</option>
          {customers.map(c => <option key={c.id} value={c.id}>{`${c.id} - ${c.name}`}</option>)}
        </select>

        <select value={typeId} onChange={(e) => setTypeId(Number(e.target.value))}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          <option value="">Tip (ID - Ad)</option>
          {types.map(t => <option key={t.id} value={t.id}>{`${t.id} - ${t.name}`}</option>)}
        </select>

        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />
        <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />

        <select value={status} onChange={(e) => setStatus(e.target.value)}
                style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}>
          <option value="scheduled">scheduled</option>
          <option value="completed">completed</option>
          <option value="canceled">canceled</option>
        </select>

        <input placeholder="Not (ops.)" value={note} onChange={(e) => setNote(e.target.value)}
               style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }} />

        <button onClick={add} style={{ border: "none", borderRadius: 8, background: "#111", color: "#fff" }}>Ekle</button>
      </div>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : rows.length === 0 ? (
        <div style={{ color: "#777" }}>Kayıt yok. Yukarıdan ekleyebilirsin.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
            <th style={{ padding: 8 }}>ID</th>
            <th style={{ padding: 8 }}>Müşteri</th>
            <th style={{ padding: 8 }}>Tip</th>
            <th style={{ padding: 8 }}>Başlangıç</th>
            <th style={{ padding: 8 }}>Bitiş</th>
            <th style={{ padding: 8 }}>Durum</th>
            <th style={{ padding: 8 }}>Not</th>
          </tr>
          </thead>
          <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
              <td style={{ padding: 8 }}>{r.id}</td>
              <td style={{ padding: 8 }}>{r.customerName ?? r.customerId}</td>
              <td style={{ padding: 8 }}>{r.typeName ?? r.typeId}</td>
              <td style={{ padding: 8 }}>{r.startAt}</td>
              <td style={{ padding: 8 }}>{r.endAt ?? "—"}</td>
              <td style={{ padding: 8 }}>{r.status}</td>
              <td style={{ padding: 8 }}>{r.note ?? "—"}</td>
            </tr>
          ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
