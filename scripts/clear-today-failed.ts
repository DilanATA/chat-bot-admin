import { db } from "../lib/db";

const tenant = process.argv[2] || "FIRMA_A";

const start = new Date(); start.setHours(0,0,0,0);
const end = new Date();   end.setHours(23,59,59,999);

const info = db.prepare(
  `DELETE FROM message_logs
   WHERE tenant = ?
     AND status = 'failed'
     AND timestamp BETWEEN ? AND ?`
).run(tenant, start.getTime(), end.getTime());

console.log(`🧹 Deleted failed for ${tenant}:`, info.changes);
