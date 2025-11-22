import { config } from "dotenv";
import path from "path";

const p1 = path.resolve(process.cwd(), ".env.local");
config({ path: p1 });
if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
  // .env.local yoksa .env de dene
  const p2 = path.resolve(process.cwd(), ".env");
  config({ path: p2 });
}
console.log("🔎 ENV loaded:",
  "client_email:",
  process.env.GOOGLE_SHEETS_CLIENT_EMAIL ? "OK" : "MISSING"
);
