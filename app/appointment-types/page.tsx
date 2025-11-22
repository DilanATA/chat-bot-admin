"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: number;                 // tenant-bazlı sıra
  name: string;
  createdAt: string;
  updatedAt?: string | null;
};

const DEFAULT_TENANTS = ["FIRMA_A", "FIRMA_B", "FIRMA_C"];

// Sadece A-Z 0-9 _ . - kalsın
function sanitizeTenant(v: string) {
  return v.trim().toUpperCase().replace(/[^A-Z0-9_.-]/g, "");
}

export default function AppointmentTypesPage() {
  const [tenant, setTenant] = useState<string>("");
  const [tenants, setTenants] = useState<string[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  // Ekle / düzenle state
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  // İlk yükleme: tenant listesi + URL'den/LS'den seçili tenant
  useEffect(() => {
    const storedTenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    const arr: string[] =
      Array.isArray(storedTenants) && storedTenants.length > 0
        ? storedTenants
        : DEFAULT_TENANTS;
    setTenants(arr);

    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("tenant") || "";
    const storedTenant = localStorage.getItem("tenantId") || "";
    const t = sanitizeTenant(fromUrl || storedTenant || arr[0] || "");

    setTenant(t);
    if (t) {
      url.searchParams.set("tenant", t);
      window.history.replaceState({}, "", url.toString());
      document.cookie = `tenantId=${t}; path=/; max-age=31536000`;
    }
  }, []);

  // Tenant değişince persist + listeyi yükle
  useEffect(() => {
    if (!tenant) return;
    localStorage.setItem("tenantId", tenant);
    document.cookie = `tenantId=${tenant}; path=/; max-age=31536000`;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant]);

  async function load() {
    if (!tenant) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/appointment-types?tenant=${encodeURIComponent(tenant)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  async function add() {
    const n = name.trim();
    if (!n || !tenant) return;

    const res = await fetch(
      `/api/appointment-types?tenant=${encodeURIComponent(tenant)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      }
    );

    if (!res.ok) {
      if (res.status === 409) {
        alert("Bu firmada aynı ad zaten var.");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Eklerken hata");
      }
      return;
    }

    setName("");
    await load();
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  async function saveEdit() {
    if (editingId == null || !tenant) return;
    const n = editingName.trim();
    if (!n) return;

    const res = await fetch(
      `/api/appointment-types/${editingId}?tenant=${encodeURIComponent(
        tenant
      )}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      }
    );

    if (!res.ok) {
      if (res.status === 409) {
        alert("Bu firmada aynı ad zaten var.");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Güncellerken hata");
      }
      return;
    }

    setEditingId(null);
    setEditingName("");
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Silinsin mi?")) return;

    const res = await fetch(
      `/api/appointment-types/${id}?tenant=${encodeURIComponent(tenant)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Silerken hata");
      return;
    }
    await load();
  }

  // Yeni firma ekleme (sadece combobox + buton, free text yok)
  const [showTenantPrompt, setShowTenantPrompt] = useState(false);
  const [newTenantInput, setNewTenantInput] = useState("");

  function confirmAddTenant() {
    const t = sanitizeTenant(newTenantInput);
    if (!t) {
      alert("Geçerli bir firma adı gir (A-Z 0-9 _ . -).");
      return;
    }
    if (tenants.includes(t)) {
      alert("Bu firma zaten var.");
      return;
    }
    const next = [t, ...tenants];
    setTenants(next);
    localStorage.setItem("tenants", JSON.stringify(next));
    setTenant(t); // otomatik seç
    setNewTenantInput("");
    setShowTenantPrompt(false);

    // URL'e de yazalım
    const url = new URL(window.location.href);
    url.searchParams.set("tenant", t);
    window.history.replaceState({}, "", url.toString());
  }

  const tenantLabel = useMemo(() => tenant || "—", [tenant]);

  return (
    <div
      style={{
        maxWidth: 840,
        margin: "40px auto",
        padding: 16,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>
        Randevu Tipleri{" "}
        <span style={{ color: "#666", fontSize: 14 }}>({tenantLabel})</span>
      </h1>

      {/* Firma seçici (SADECE combobox) + yeni firma ekle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <select
          value={tenant}
          onChange={(e) => setTenant(sanitizeTenant(e.target.value))}
          style={{ padding: 8, border: "1px solid #ddd", borderRadius: 8 }}
        >
          {tenants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowTenantPrompt(true)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          Yeni Firma Ekle
        </button>
      </div>

      {showTenantPrompt && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            value={newTenantInput}
            onChange={(e) => setNewTenantInput(e.target.value)}
            placeholder="Yeni firma (örn. FIRMA_X)"
            style={{
              flex: 1,
              padding: 8,
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          />
          <button
            onClick={confirmAddTenant}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "#111",
              color: "#fff",
            }}
          >
            Kaydet
          </button>
          <button
            onClick={() => {
              setNewTenantInput("");
              setShowTenantPrompt(false);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #ccc",
              background: "#fff",
            }}
          >
            İptal
          </button>
        </div>
      )}

      {/* Yeni tip ekleme */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yeni tip adı (örn. muayene)"
          style={{
            flex: 1,
            padding: 10,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <button
          onClick={add}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
          }}
        >
          Ekle
        </button>
      </div>

      {loading ? (
        <div>Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div style={{ color: "#777" }}>
          Henüz kayıt yok. Yukarıdan ekleyebilirsin.
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #eee" }}>
              <th style={{ padding: 8 }}>ID (Firma-bazlı)</th>
              <th style={{ padding: 8 }}>Ad</th>
              <th style={{ padding: 8, width: 220 }}>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={`${tenant}-${it.id}`}
                style={{ borderBottom: "1px solid #f3f3f3" }}
              >
                <td style={{ padding: 8 }}>{it.id}</td>
                <td style={{ padding: 8 }}>
                  {editingId === it.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{
                        padding: 8,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        width: "100%",
                      }}
                    />
                  ) : (
                    it.name
                  )}
                </td>
                <td style={{ padding: 8 }}>
                  {editingId === it.id ? (
                    <>
                      <button
                        onClick={saveEdit}
                        style={{
                          padding: "8px 12px",
                          marginRight: 8,
                          borderRadius: 8,
                          border: "none",
                          background: "#0a7",
                          color: "#fff",
                        }}
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingName("");
                        }}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                      >
                        İptal
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(it)}
                        style={{
                          padding: "8px 12px",
                          marginRight: 8,
                          borderRadius: 8,
                          border: "1px solid #ccc",
                          background: "#fff",
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => remove(it.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: "#d33",
                          color: "#fff",
                        }}
                      >
                        Sil
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
