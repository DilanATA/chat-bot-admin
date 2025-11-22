// worker/src/whatsappClient.ts
import axios from 'axios';
import { cfg } from './config';

export async function sendMuayeneReminder({
  to,
  name,
  plate,
  date,
}: {
  to: string;
  name: string;
  plate: string;
  date: string;
}) {
  if (!cfg.phoneNumberId || !cfg.token) {
    console.log('⚠️ WHATSAPP_PHONE_NUMBER_ID veya TOKEN boş – test modunda çalışılıyor.');
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${cfg.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: cfg.templateName,
      language: {
        code: cfg.templateLang,
      },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: plate },
            { type: 'text', text: date },
          ],
        },
      ],
    },
  };

  try {
    const res = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${cfg.token}` },
    });

    return res.data;
  } catch (e: any) {
    console.error('❌ WhatsApp gönderim hatası:', e.response?.data || e);
    throw e;
  }
}
