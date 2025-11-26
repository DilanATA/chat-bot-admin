// lib/whatsapp-settings.ts
import { db } from "./db";

export type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null;
};

export function getWhatsappSettings(tenantId: string): WhatsappSettings | null {
  const row = db.prepare(
    `
    SELECT
      access_token   AS accessToken,
      phone_number_id AS phoneNumberId,
      business_id    AS businessId,
      verify_token   AS verifyToken,
      webhook_url    AS webhookUrl
    FROM tenant_whatsapp_settings
    WHERE tenant_id = ?
    `
  ).get(tenantId);

  return row ?? null;
}

export function upsertWhatsappSettings(tenantId: string, s: WhatsappSettings) {
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO tenant_whatsapp_settings
      (tenant_id, access_token, phone_number_id, business_id, verify_token, webhook_url, updated_at)
    VALUES
      (?,         ?,           ?,              ?,           ?,            ?,           ?)
    ON CONFLICT(tenant_id) DO UPDATE SET
      access_token    = excluded.access_token,
      phone_number_id = excluded.phone_number_id,
      business_id     = excluded.business_id,
      verify_token    = excluded.verify_token,
      webhook_url     = excluded.webhook_url,
      updated_at      = excluded.updated_at
    `
  ).run(
    tenantId,
    s.accessToken,
    s.phoneNumberId,
    s.businessId ?? null,
    s.verifyToken ?? null,
    s.webhookUrl ?? null,
    now
  );
  return { ok: true };
}
