"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const data = await res.json();
      console.log("API yanıtı:", data);

      if (res.ok && data.ok) {
        localStorage.setItem("logged_in", "yes");
        router.push("/dashboard");
      } else {
        setError("Şifre yanlış!");
      }
    } catch (e) {
      console.error("Login error:", e);
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="bg-gray-800 p-6 rounded-xl shadow w-96">
        <h2 className="text-white text-xl mb-4 text-center">
          🔐 Admin Panel Giriş
        </h2>

        <input
          type="password"
          placeholder="Admin Şifre"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full p-2 rounded mb-2 bg-gray-900 text-white border border-gray-700"
        />

        {error && (
          <p className="text-red-400 text-sm mb-2 text-center">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white p-2 rounded"
        >
          {loading ? "Kontrol ediliyor..." : "Giriş Yap"}
        </button>
      </div>
    </div>
  );
}
