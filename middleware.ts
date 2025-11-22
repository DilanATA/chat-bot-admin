import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);

  // 1) Öncelik: query (?tenant=FIRMA123)
  let tenant = url.searchParams.get("tenant")?.trim();

  // 2) Yoksa cookie: tenantId
  if (!tenant) {
    const cookieTenant = req.cookies.get("tenantId")?.value?.trim();
    if (cookieTenant) tenant = cookieTenant;
  }

  // 3) Yoksa (opsiyonel) subdomain: firma.example.com
  // Örn: const host = req.headers.get("host") || "";
  //      tenant = tenant ?? host.split(".")[0];

  const res = NextResponse.next();

  // Tenant varsa header’a koy
  if (tenant) {
    res.headers.set("x-tenant-id", tenant);
  }

  return res;
}

// Sadece API çağrılarına uygula
export const config = {
  matcher: ["/api/:path*"],
};
