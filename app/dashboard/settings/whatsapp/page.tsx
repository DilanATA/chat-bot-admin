"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Copy } from "lucide-react";

type WhatsappSettings = {
  phoneNumberId: string;
  businessId: string;
  accessToken: string;
  verifyToken: string;
  webhookUrl: string;
};

type MessageLog = {
  id: number;
  tenant: string;
  to_phone: string;
  result: string;
  created_at: string;
};

export default function WhatsappSettingsPage() {
  const [settings, setSettings] = useState<WhatsappSettings>({
    phoneNumberId: "",
    businessId: "",
    accessToken: "",
    verifyToken: "",
    webhookUrl: "",
  });
  const [original, setOriginal] = useState<WhatsappSettings | null>(null);
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const params = useSearchParams();
  const tenant = params.get("tenant") ?? "DEFAULT";

  // ✅ Ayarları getir
  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch(`/api/whatsapp-settings?tenant=${tenant}`);
      const json = await res.json();
      if (json.ok && json.data) {
        setSettings(json.data);
        setOriginal(json.data);
      }
    }
    fetchSettings();
  }, [tenant]);

  // ✅ Logları getir
  async function fetchLogs() {
    try {
      const res = await fetch(`/api/message-logs?tenant=${tenant}`);
      const json = await res.json();
      if (json.ok) setLogs(json.data);
    } catch (err) {
      console.error("Log yüklenemedi:", err);
    }
  }

  // İlk yüklemede logları al
  useEffect(() => {
    fetchLogs();
  }, [tenant]);

  // ✅ Değişiklik olup olmadığını kontrol et
  const hasChanges = original
    ? JSON.stringify(settings) !== JSON.stringify(original)
    : false;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!settings.phoneNumberId || !settings.accessToken || !settings.verifyToken) {
      toast({
        title: "⚠️ Eksik Bilgi",
        description: "Zorunlu alanları doldurmalısınız.",
        variant: "error",
      });
      return;
    }

    if (!hasChanges) {
      toast({
        title: "ℹ️ Değişiklik Yok",
        description: "Kaydedilecek bir değişiklik bulunmuyor.",
        variant: "default",
      });
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp-settings?tenant=${tenant}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (json.ok) {
        toast({
          title: "✅ Kaydedildi",
          description: `${tenant} ayarları güncellendi.`,
          variant: "success",
        });
        setOriginal(settings);
        setEditing(false);
      } else {
        toast({
          title: "❌ Hata",
          description: json.error,
          variant: "error",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  // 👁 Token gizle/göster
  const toggleTokenVisibility = () => setShowToken((p) => !p);

  // 📋 URL kopyalama
  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(settings.webhookUrl || "");
    toast({
      title: "📋 Kopyalandı",
      description: "Webhook URL panoya kopyalandı.",
      variant: "success",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-4">
        WhatsApp Ayarları <span className="text-gray-400 text-sm">({tenant})</span>
      </h1>

      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Ayarlar</TabsTrigger>
          <TabsTrigger value="logs">Webhook Logları</TabsTrigger>
        </TabsList>

        {/* 🧩 AYARLAR SEKMESİ */}
        <TabsContent value="settings">
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div>
                <Label>Phone Number ID *</Label>
                <Input
                  disabled={!editing}
                  value={settings.phoneNumberId}
                  onChange={(e) =>
                    setSettings({ ...settings, phoneNumberId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Business ID</Label>
                <Input
                  disabled={!editing}
                  value={settings.businessId}
                  onChange={(e) =>
                    setSettings({ ...settings, businessId: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Label>Access Token *</Label>
                <Input
                  type={showToken ? "text" : "password"}
                  disabled={!editing}
                  value={settings.accessToken}
                  onChange={(e) =>
                    setSettings({ ...settings, accessToken: e.target.value })
                  }
                />
                {editing && (
                  <button
                    type="button"
                    onClick={toggleTokenVisibility}
                    className="absolute right-3 top-8 text-gray-500 hover:text-gray-800"
                  >
                    {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>

              <div>
                <Label>Verify Token *</Label>
                <Input
                  disabled={!editing}
                  value={settings.verifyToken}
                  onChange={(e) =>
                    setSettings({ ...settings, verifyToken: e.target.value })
                  }
                />
              </div>

              <div className="relative">
                <Label>Webhook URL</Label>
                <Input
                  disabled={!editing}
                  value={settings.webhookUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, webhookUrl: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={copyWebhookUrl}
                  className="absolute right-3 top-8 text-gray-500 hover:text-gray-800"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {!editing ? (
              <Button onClick={() => setEditing(true)}>Düzenle</Button>
            ) : (
              <Button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            )}
          </form>
        </TabsContent>

        {/* 🧩 WEBHOOK LOG SEKMESİ */}
        <TabsContent value="logs">
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              Yenile 🔄
            </Button>

            <div className="mt-4 border rounded-md">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Henüz log bulunmuyor.
                </p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="p-2 text-left">ID</th>
                      <th className="p-2 text-left">Telefon</th>
                      <th className="p-2 text-left">Sonuç</th>
                      <th className="p-2 text-left">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-t">
                        <td className="p-2">{log.id}</td>
                        <td className="p-2">{log.to_phone}</td>
                        <td className="p-2">{log.result}</td>
                        <td className="p-2">{log.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
