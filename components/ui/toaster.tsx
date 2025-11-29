"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/toast";

export interface ToastItem {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // global olarak window.toast() fonksiyonunu tanımlıyoruz
  useEffect(() => {
    (window as any).toast = (t: Omit<ToastItem, "id">) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, ...t }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, 3000);
    };
  }, []);

  return (
    <>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          title={t.title}
          description={t.description}
          variant={t.variant}
        />
      ))}
    </>
  );
}
