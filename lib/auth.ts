// Server tarafında tenant'ı yalnızca header'dan okuyoruz.
// Frontend'in body ile göndermesine izin vermiyoruz.
export async function getTenantIdFromSession(req?: Request) {
  const id = req?.headers.get("x-tenant-id")?.trim();
  // PROD'da fallback kullanma; dev aşamasında boşsa TEST_TENANT de.
  return id || "TEST_TENANT";
}
