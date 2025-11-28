import fs from "fs";
import path from "path";

export type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null;
};

const FILE_PATH =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", "whatsapp-settings.json") // Render'da yazılabilir tek dizin
    : path.join(process.cwd(), "data", "whatsapp-settings.json");

// Yardımcı: dosya yoksa oluştur
function ensureFile() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
      fs.writeFileSync(FILE_PATH, "{}", "utf8");
    }
  } catch (err) {
    console.error("⚠️ ensureFile error:", err);
  }
}

function loadAll(): Record<string, WhatsappSettings> {
  ensureFile();
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch (err) {
    console.error("⚠️ loadAll error:", err);
    return {};
  }
}

function saveAll(data: Record<string, WhatsappSettings>) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ saveAll error:", err);
  }
}

export function getWhatsappSettings(tenantId: string): WhatsappSettings | null {
  const all = loadAll();
  return all[tenantId] ?? null;
}

export function upsertWhatsappSettings(tenantId: string, s: WhatsappSettings) {
  const all = loadAll();
  all[tenantId] = {
    accessToken: s.accessToken,
    phoneNumberId: s.phoneNumberId,
    businessId: s.businessId ?? null,
    verifyToken: s.verifyToken ?? null,
    webhookUrl: s.webhookUrl ?? null,
  };
  saveAll(all);
  return { ok: true };
}
