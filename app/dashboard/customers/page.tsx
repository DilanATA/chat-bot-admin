// app/dashboard/customers/page.tsx
"use client";

import { useEffect, useState } from "react";

type Customer = {
  plate: string | null;
  name: string;
  phone: string;
  dateRaw: string;   // API'den gelen 'date' alanını buna map'leyeceğiz
  status: string;
};

export default function CustomersPage() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "today" | "pending">("all");

  // YENİ müşteri ekleme için state (POST şu an DB'ye yazar; istersen gizleyebilirsin)
  const [newCustomer, setNewCustomer] = useState({
    plate: "",
    name: "",
    phone: "",
    dateRaw: "",
    status: "Gönderilecek",
  });

  // === SİSTEM: Sheet datasını yükle ===
  async function load() {
    setLoading(true);
    const res = await fetch("/api/customers", { cache: "no-store" });
    const json = await res.json();

    // /api/customers artık DİZİ döndürüyor.
    // Ama geçmişe uyumluluk için {success, data} olursa da destekleyelim.
    const arr: any[] = Array.isArray(json) ? json : (json?.data ?? []);

    const mapped: Customer[] = arr.map((r) => ({
      plate: r.plate ?? "",
      name: r.name ?? "",
      phone: r.phone ?? "",
      dateRaw: r.date ?? r.dateRaw ?? "",   // date -> dateRaw
      status: r.status ?? "",
    }));

    setRows(mapped);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // === RENK KODLAMA ===
  const getRowColor = (dateStr: string) => {
    if (!dateStr) return "bg-gray-900";
    const today = new Date().toISOString().split("T")[0];
    if (dateStr === today) return "bg-red-700";
    return "bg-gray-900";
  };

  // === FİLTRE ===
  const filtered = rows.filter((r) => {
    if (filter === "all") return true;
    if (filter === "pending") return r.status?.toLowerCase().includes("gönder");
    if (filter === "today") {
      const today = new Date().toISOString().split("T")[0];
      return r.dateRaw === today;
    }
    return true;
  });

  // === MÜŞTERİ EKLE ===
  async function handleAdd() {
    if (!newCustomer.plate || !newCustomer.name || !newCustomer.phone || !newCustomer.dateRaw) {
      alert("Tüm alanları doldurmalısın.");
      return;
    }

    const res = await fetch("/api/customers/add", {
      method: "POST",
      body: JSON.stringify(newCustomer),
    });

    const json = await res.json();

    if (!json.success) {
      alert("Hata: " + json.error);
      return;
    }

    alert("Müşteri eklendi!");
    await load();
  }

  // === MÜŞTERİ SİL ===
  async function handleDelete(rowIndex: number) {
    if (!confirm("Silmek istediğine emin misin?")) return;

    const res = await fetch("/api/customers/delete", {
      method: "POST",
      body: JSON.stringify({ rowIndex }),
    });

    const json = await res.json();

    if (!json.success) {
      alert("Silme hatası: " + json.error);
      return;
    }

    alert("Silindi!");
    await load();
  }

  // === DURUM GÜNCELLE ===
  async function handleStatusUpdate(rowIndex: number) {
    const res = await fetch("/api/customers/update-status", {
      method: "POST",
      body: JSON.stringify({ rowIndex, status: "Gönderildi" }),
    });

    const json = await res.json();

    if (!json.success) {
      alert("Durum güncelleme hatası: " + json.error);
      return;
    }

    alert("Durum güncellendi!");
    await load();
  }

  // === TEST GÖNDER ===
  async function sendTest(phone: string) {
    if (!confirm(`${phone} numarasına test mesajı gönderilsin mi?`)) return;

    const res = await fetch("/api/send-test", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });

    const json = await res.json();

    if (!json.success) {
      alert("Gönderim hatası: " + json.error);
      return;
    }

    alert("Test mesajı gönderildi! 🎉");
    await load();
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Müşteri Listesi 👥</h1>

      {/* =============== MÜŞTERİ EKLE FORMU =============== */}
      <div className="p-4 bg-gray-800 rounded mb-6">
        <h2 className="text-xl mb-3">Müşteri Ekle</h2>

        <div className="flex flex-col gap-2">
          <input
            className="p-2 bg-gray-700 rounded"
            placeholder="Plaka"
            onChange={(e) => setNewCustomer({ ...newCustomer, plate: e.target.value })}
          />

          <input
            className="p-2 bg-gray-700 rounded"
            placeholder="Müşteri Adı"
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
          />

          <input
            className="p-2 bg-gray-700 rounded"
            placeholder="Telefon"
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
          />

          <input
            type="date"
            className="p-2 bg-gray-700 rounded"
            onChange={(e) => setNewCustomer({ ...newCustomer, dateRaw: e.target.value })}
          />

          <button className="px-4 py-2 bg-blue-600 rounded mt-2" onClick={handleAdd}>
            Kaydet
          </button>
        </div>
      </div>

      {/* =============== FİLTRE =============== */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-2 rounded ${filter === "all" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Tümü
        </button>
        <button
          onClick={() => setFilter("today")}
          className={`px-3 py-2 rounded ${filter === "today" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Bugün
        </button>
        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-2 rounded ${filter === "pending" ? "bg-blue-600" : "bg-gray-700"}`}
        >
          Gönderilecekler
        </button>
      </div>

      {/* =============== TABLO =============== */}
      {!loading && filtered.length > 0 && (
        <table className="w-full text-left border border-gray-700 text-sm">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-2 border border-gray-700">Plaka</th>
              <th className="p-2 border border-gray-700">Müşteri</th>
              <th className="p-2 border border-gray-700">Telefon</th>
              <th className="p-2 border border-gray-700">Muayene Tarihi</th>
              <th className="p-2 border border-gray-700">Durum</th>
              <th className="p-2 border border-gray-700">Sil</th>
              <th className="p-2 border border-gray-700">Durum</th>
              <th className="p-2 border border-gray-700">Test</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} className={`${getRowColor(c.dateRaw)} hover:bg-gray-700`}>
                <td className="p-2 border border-gray-700">{c.plate}</td>
                <td className="p-2 border border-gray-700">{c.name}</td>
                <td className="p-2 border border-gray-700">{c.phone}</td>
                <td className="p-2 border border-gray-700">{c.dateRaw}</td>
                <td className="p-2 border border-gray-700">{c.status}</td>

                <td className="p-2 border border-gray-700">
                  <button className="px-3 py-1 bg-red-600 rounded" onClick={() => handleDelete(i)}>
                    Sil
                  </button>
                </td>

                <td className="p-2 border border-gray-700">
                  <button
                    className="px-3 py-1 bg-green-600 rounded"
                    onClick={() => handleStatusUpdate(i)}
                  >
                    Gönderildi
                  </button>
                </td>

                <td className="p-2 border border-gray-700">
                  <button
                    className="px-3 py-1 bg-yellow-500 text-black rounded"
                    onClick={() => sendTest(c.phone)}
                  >
                    Test Gönder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-gray-400">Kayıt yok</div>
      )}
    </div>
  );
}
