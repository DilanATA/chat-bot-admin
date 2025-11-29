// lib/whatsapp-settings.ts
// WhatsApp ayarlarını SQLite veritabanında tutar

import { openDb } from "@/lib/migrate";

export type WhatsappSettings = {
  accessToken: string;
  phoneNumberId: string;
  businessId?: string | null;
  verifyToken?: string | null;
  webhookUrl?: string | null;
};

// Ayarları getir
export function getWhatsappSettings(tenant: string): WhatsappSettings | null {
  const db = openDb();

  const row = db
    .prepare(
      `
      SELECT
        access_token as accessToken,
        phone_number_id as phoneNumberId,
        business_id as businessId,
        verify_token as verifyToken,
        webhook_url as webhookUrl
      FROM tenant_whatsapp_settings
      WHERE tenant = ?
    `
    )
    .get(tenant);

  return row || null;
}

// Ayarları ekle veya güncelle
export function upsertWhatsappSettings(tenant: string, s: WhatsappSettings) {
  const db = openDb();

  db.prepare(
    `
    INSERT INTO tenant_whatsapp_settings (
      tenant,
      access_token,
      phone_number_id,
      business_id,
      verify_token,
      webhook_url
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(tenant)
    DO UPDATE SET
      access_token = excluded.access_token,
      phone_number_id = excluded.phone_number_id,
      business_id = excluded.business_id,
      verify_token = excluded.verify_token,
      webhook_url = excluded.webhook_url
  `
  ).run(
    tenant,
    s.accessToken,
    s.phoneNumberId,
    s.businessId ?? null,
    s.verifyToken ?? null,
    s.webhookUrl ?? null
  );

  return { ok: true };
}
