// app/dashboard/logs/messages/page.tsx
"use client";

import { useEffect, useState } from "react";

type Row = {
  id: number;
  tenant: string | null;
  phone: string | null;
  message_id: string | null;
  status: string | null;
  timestamp: number | null;
};

export default function MessageLogsPage() {
  const [tenant, setTenant] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tenant) qs.set("tenant", tenant);
      if (status) qs.set("status", status);
      qs.set("limit", "200");
      const res = await fetch(`/api/message-logs?` + qs.toString());
      const json = await res.json();
      setRows(json?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Message Logs</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border rounded p-2"
          placeholder="tenant (örn: FIRMA_A)"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="status (delivered/read/failed)"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={load} disabled={loading}>
          {loading ? "Yükleniyor…" : "Filtrele"}
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">#</th>
              <th className="text-left p-2">Tenant</th>
              <th className="text-left p-2">Phone</th>
              <th className="text-left p-2">Message ID</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.tenant}</td>
                <td className="p-2">{r.phone}</td>
                <td className="p-2">{r.message_id}</td>
                <td className="p-2">{r.status}</td>
                <td className="p-2">
                  {r.timestamp ? new Date(r.timestamp).toLocaleString() : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td className="p-4" colSpan={6}>Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
