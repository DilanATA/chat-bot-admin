// worker/src/tenants.ts

import { db } from "../../lib/db";
import type { TenantSettings } from "./types";

export function listTenants(): TenantSettings[] {
  return db.prepare("SELECT * FROM tenant_settings").all() as TenantSettings[];
}
