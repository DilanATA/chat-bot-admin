"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [count, setCount] = useState(0);

  async function load() {
    const res = await fetch("/api/stats");
    const json = await res.json();
    setCount(json.todayCount || 0);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="border p-6 rounded-xl w-64 bg-white shadow">
        <h2 className="text-lg font-semibold mb-2">Bugün Gönderilen Mesajlar</h2>

        <div className="text-5xl font-bold text-blue-600">{count}</div>

        <div className="mt-3 h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded"
            style={{ width: `${Math.min(count * 10, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
