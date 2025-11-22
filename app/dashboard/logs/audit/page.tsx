// app/dashboard/logs/audit/page.tsx
"use client";

import { useEffect, useState } from "react";

type Row = {
  id: number;
  tenant: string | null;
  action: string | null;
  details: string | null;
  created_at: number | null;
};

export default function AuditLogsPage() {
  const [tenant, setTenant] = useState("");
  const [action, setAction] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (tenant) qs.set("tenant", tenant);
      if (action) qs.set("action", action);
      qs.set("limit", "200");
      const res = await fetch(`/api/audit-logs?` + qs.toString());
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
      <h1 className="text-2xl font-semibold mb-4">Audit Logs</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border rounded p-2"
          placeholder="tenant (örn: FIRMA_A)"
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
        />
        <input
          className="border rounded p-2"
          placeholder="action (örn: tenant_settings.update)"
          value={action}
          onChange={(e) => setAction(e.target.value)}
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
              <th className="text-left p-2">Action</th>
              <th className="text-left p-2">Details</th>
              <th className="text-left p-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.id}</td>
                <td className="p-2">{r.tenant}</td>
                <td className="p-2">{r.action}</td>
                <td className="p-2">
                  <pre className="whitespace-pre-wrap break-words">{r.details}</pre>
                </td>
                <td className="p-2">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr><td className="p-4" colSpan={5}>Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
