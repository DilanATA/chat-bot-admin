"use client";

import { useEffect, useState } from "react";

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/logs", { cache: "no-store" });
        const json = await res.json();

        if (json.success) setLogs(json.data || []);
      } catch (e) {
        console.error("Logs yüklenemedi:", e);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Loglar</h1>

      {loading && <p>Yükleniyor...</p>}

      {!loading && logs.length === 0 && (
        <p className="text-gray-400">Henüz log yok.</p>
      )}

      {!loading && logs.length > 0 && (
        <div className="space-y-2">
          {logs.slice(0, 100).map((log, i) => (
            <div
              key={i}
              className="p-3 bg-gray-800 border border-gray-700 rounded"
            >
              <p className="text-sm">{log}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
