import { db } from "../../lib/db";

export function alreadySentToday(tenant: string, phone: string): boolean {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date();   end.setHours(23,59,59,999);

  // YALNIZCA başarılı/gerçek gönderimler dedupe etsin:
  const row = db.prepare(
    `SELECT COUNT(*) AS cnt FROM message_logs
     WHERE tenant = ?
       AND phone = ?
       AND status IN ('sent','delivered','read')
       AND timestamp BETWEEN ? AND ?`
  ).get(tenant, phone, start.getTime(), end.getTime()) as { cnt?: number };

  return (row?.cnt ?? 0) > 0;
}
