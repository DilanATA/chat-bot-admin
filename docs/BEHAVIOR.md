# Current Behavior (Sprint-2 stable)

- Sandbox WhatsApp: yalnızca “test recipients” listesindeki numaralara gidebilir.
- Template parametreleri: `{{1}} AdSoyad, {{2}} Plaka, {{3}} Tarih` – worker `bodyParams` bu sırayla gönderir.
- Tarih filtresi: Şimdilik tarih kontrolü yapmadan gönderir (ileri fazda eklenecek).
- Dedupe: Aynı gün, aynı telefonda `status IN (sent, delivered, read)` varsa tekrar göndermez.
- Status yazımı: Google Sheet `status_col` (E sütunu) hücresi “GÖNDERİLDİ HH:MM” olarak güncellenir.
- Webhook: /api/webhook/whatsapp → message_logs + audit_logs (Meta ayarları yapıldığında delivered/read yazacaktır).
- Node runtime: API route’lar `export const runtime = "nodejs"` ile çalışır (Edge değil).
