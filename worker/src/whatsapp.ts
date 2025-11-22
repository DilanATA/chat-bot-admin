// worker/src/whatsapp.ts
import axios from "axios";
// Tercihen utils'ten al:
import { normalizePhoneTR as normalizeE164 } from "./utils";

/**
 * ENV desteği (geriye dönük uyumlu):
 *  Zorunlu:
 *    WHATSAPP_TOKEN  || WA_ACCESS_TOKEN
 *    WHATSAPP_PHONE_NUMBER_ID || WA_PHONE_NUMBER_ID
 *  Opsiyonel:
 *    WA_TEMPLATE_NAME (vars: "muayene_hatirlatma")
 *    WA_TEMPLATE_LANG (vars: "tr")
 *    WHATSAPP_GRAPH_VERSION (vars: "v24.0")
 */

const TOKEN =
  process.env.WHATSAPP_TOKEN ||
  process.env.WA_ACCESS_TOKEN ||
  "";

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID ||
  process.env.WA_PHONE_NUMBER_ID ||
  "";

const DEFAULT_TEMPLATE_NAME = process.env.WA_TEMPLATE_NAME || "muayene_hatirlatma";
const DEFAULT_TEMPLATE_LANG = process.env.WA_TEMPLATE_LANG || "tr";
const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v24.0";

function requireWhatsAppEnv() {
  if (!TOKEN) throw new Error("WhatsApp token eksik (WHATSAPP_TOKEN veya WA_ACCESS_TOKEN).");
  if (!PHONE_NUMBER_ID) throw new Error("PHONE_NUMBER_ID eksik (WHATSAPP_PHONE_NUMBER_ID veya WA_PHONE_NUMBER_ID).");
}

// Eski dosyada vardı; utils kullanmıyorsan basit bir fallback:
function fallbackNormalizeE164(input: string): string {
  const digits = (input || "").replace(/\D+/g, "");
  if (digits.startsWith("90")) return "+" + digits;
  if (digits.startsWith("0")) return "+9" + digits;     // 0XXXXXXXXXX -> +90XXXXXXXXXX
  if (digits.length === 10) return "+90" + digits;      // 5XXXXXXXXX  -> +905XXXXXXXXX
  if (input.startsWith("+")) return input;
  return "+" + digits;
}

export type SendResult = { ok: boolean; message_id?: string; error?: any };

type SendTemplateOpts = {
  phone: string;                 // E164 numara (biz normalize ediyoruz)
  template?: string;             // default WA_TEMPLATE_NAME
  lang?: string;                 // default WA_TEMPLATE_LANG
  /** Meta "components" yapısı (header/body/buttons). Body değişkenleri için alternatif olarak bodyParams kullanabilirsin */
  components?: any[];
  /** Sadece body text parametreleri için kısa yol: ["Ad Soyad", "34ABC123", "12.12.2025"] */
  bodyParams?: string[];
};

export async function sendTemplateMessage(opts: SendTemplateOpts): Promise<SendResult> {
  requireWhatsAppEnv();

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`;

  const phoneE164 =
    (typeof normalizeE164 === "function" ? normalizeE164(opts.phone) : null) ||
    fallbackNormalizeE164(opts.phone);

  // components öncelikli; yoksa bodyParams'tan components üret
  const components =
    opts.components ||
    (opts.bodyParams && opts.bodyParams.length
      ? [
          {
            type: "body",
            parameters: opts.bodyParams.map((txt) => ({ type: "text", text: String(txt ?? "") })),
          },
        ]
      : undefined);

  const payload = {
    messaging_product: "whatsapp",
    to: phoneE164,
    type: "template" as const,
    template: {
      name: opts.template || DEFAULT_TEMPLATE_NAME,
      language: { code: opts.lang || DEFAULT_TEMPLATE_LANG },
      ...(components ? { components } : {}),
    },
  };

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });
    const message_id = res.data?.messages?.[0]?.id;
    return { ok: true, message_id };
  } catch (err: any) {
    const api = err?.response?.data || err?.message || String(err);
    console.error("❌ WhatsApp API Error:", api);
    return { ok: false, error: api };
  }
}

/**
 * Eski özel sarmalayıcının yerine, aynı davranışı tek satırla yap:
 * await sendTemplateMessage({
 *   phone: to,
 *   template: templateName,
 *   lang,
 *   bodyParams: [name, plate, dateText]
 * });
 */
