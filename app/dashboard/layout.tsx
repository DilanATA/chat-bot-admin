// app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // --- Basit Auth Kontrolü ---
  useEffect(() => {
    const logged = localStorage.getItem("logged_in");
    if (logged !== "yes") {
      router.push("/login");
    }
  }, []);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      
      {/* Sol Menü */}
      <aside className="w-60 bg-gray-800 p-4 flex flex-col space-y-4">
        <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

        <Link href="/dashboard" className="hover:text-blue-400">
          🏠 Dashboard
        </Link>

        <Link href="/dashboard/customers" className="hover:text-blue-400">
          👥 Müşteriler
        </Link>

        <Link href="/dashboard/logs" className="hover:text-blue-400">
          📄 Loglar
        </Link>

        <Link href="/dashboard/settings" className="hover:text-blue-400">
          ⚙️ Ayarlar
        </Link>

        <button
          onClick={() => {
            localStorage.removeItem("logged_in");
            router.push("/login");
          }}
          className="mt-auto bg-red-600 hover:bg-red-700 p-2 rounded"
        >
          Çıkış Yap
        </button>
      </aside>

      {/* İçerik Alanı */}
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  );
}
