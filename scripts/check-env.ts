// scripts/check-env.ts
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") }); // .env.local
// fallback .env
if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
  config({ path: path.resolve(process.cwd(), ".env") });
}

function mask(v?: string | null) {
  if (!v) return "MISSING";
  if (v.length <= 8) return v;
  return v.slice(0, 4) + "..." + v.slice(-4);
}

console.log("GOOGLE_SHEETS_CLIENT_EMAIL:", process.env.GOOGLE_SHEETS_CLIENT_EMAIL || "MISSING");
console.log("GOOGLE_SHEETS_PRIVATE_KEY:", process.env.GOOGLE_SHEETS_PRIVATE_KEY ? "SET" : "MISSING");
console.log("WHATSAPP_TOKEN:", mask(process.env.WHATSAPP_TOKEN));
console.log("WA_ACCESS_TOKEN:", mask(process.env.WA_ACCESS_TOKEN));
console.log("WHATSAPP_PHONE_NUMBER_ID:", process.env.WHATSAPP_PHONE_NUMBER_ID || "MISSING");
console.log("WA_PHONE_NUMBER_ID:", process.env.WA_PHONE_NUMBER_ID || "MISSING");
console.log("WA_TEMPLATE_NAME:", process.env.WA_TEMPLATE_NAME || "MISSING");
console.log("WA_TEMPLATE_LANG:", process.env.WA_TEMPLATE_LANG || "MISSING");
console.log("WHATSAPP_GRAPH_VERSION:", process.env.WHATSAPP_GRAPH_VERSION || "MISSING");
