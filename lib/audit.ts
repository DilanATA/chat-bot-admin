// lib/audit.ts
import { db } from "./db";

export function logAudit(tenant: string | null, action: string, details: any = {}) {
  try {
    const stmt = db.prepare(
      "INSERT INTO audit_logs (tenant, action, details, created_at) VALUES (?, ?, ?, ?)"
    );
    stmt.run(tenant || null, action, JSON.stringify(details), Date.now());
  } catch (e) {
    console.error("audit_log_error", e);
  }
}
