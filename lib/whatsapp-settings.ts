import fs from "fs";
import path from "path";

export type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null;
};

// Render'da yazılabilir tek dizin /tmp; yerelde data/
const FILE_PATH =
  process.env.NODE_ENV === "production"
    ? "/tmp/whatsapp-settings.json"
    : path.join(process.cwd(), "data", "whatsapp-settings.json");

// Bellek içi yedek
const memoryStore: Record<string, WhatsappSettings> = {};

function ensureDirSafe() {
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    // Render ortamında fs devre dışıysa sessiz geç
  }
}

function readFileSafe(): Record<string, WhatsappSettings> {
  try {
    ensureDirSafe();
    if (!fs.existsSync(FILE_PATH)) return {};
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    return JSON.parse(raw || "{}");
  } catch {
    return { ...memoryStore }; // fallback
  }
}

function writeFileSafe(data: Record<string, WhatsappSettings>) {
  try {
    ensureDirSafe();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // fs başarısızsa bellekte tut
    Object.assign(memoryStore, data);
  }
}

export function getWhatsappSettings(tenantId: string): WhatsappSettings | null {
  const all = readFileSafe();
  return all[tenantId] ?? null;
}

export function upsertWhatsappSettings(tenantId: string, s: WhatsappSettings) {
  const all = readFileSafe();
  all[tenantId] = {
    accessToken: s.accessToken,
    phoneNumberId: s.phoneNumberId,
    businessId: s.businessId ?? null,
    verifyToken: s.verifyToken ?? null,
    webhookUrl: s.webhookUrl ?? null,
  };
  writeFileSafe(all);
  return { ok: true };
}
