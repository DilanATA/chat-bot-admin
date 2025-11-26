// lib/whatsapp-settings.ts
import { db } from "./db";

export interface WhatsappSettings {
  accessToken: string;
  phoneNumberId: string;
  businessId: string;
  verifyToken: string;
}

// tenant burada TEXT (örn: "FIRMA_A")
export function getWhatsappSettings(tenant: string): WhatsappSettings | null {
  const row = db
    .prepare(
      `
      SELECT
        access_token  AS accessToken,
        phone_number_id AS phoneNumberId,
        business_id   AS businessId,
        verify_token  AS verifyToken
      FROM tenant_whatsapp_settings
      WHERE tenant = ?
    `
    )
    .get(tenant) as WhatsappSettings | undefined;

  return row ?? null;
}

export function upsertWhatsappSettings(
  tenant: string,
  settings: WhatsappSettings
) {
  const now = Math.floor(Date.now() / 1000); // INTEGER timestamp

  db.prepare(
    `
    INSERT INTO tenant_whatsapp_settings (
      tenant, access_token, phone_number_id,
      business_id, verify_token, created_at, updated_at
    )
    VALUES (
      @tenant, @accessToken, @phoneNumberId,
      @businessId, @verifyToken, @createdAt, @updatedAt
    )
    ON CONFLICT(tenant) DO UPDATE SET
      access_token    = excluded.access_token,
      phone_number_id = excluded.phone_number_id,
      business_id     = excluded.business_id,
      verify_token    = excluded.verify_token,
      updated_at      = excluded.updated_at
  `
  ).run({
    tenant,
    accessToken: settings.accessToken,
    phoneNumberId: settings.phoneNumberId,
    businessId: settings.businessId,
    verifyToken: settings.verifyToken,
    createdAt: now,
    updatedAt: now,
  });
}
