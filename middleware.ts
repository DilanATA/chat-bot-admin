// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  // Webhook doğrulamasına kesinlikle dokunma
  if (p.startsWith("/api/webhook")) return NextResponse.next();

  // Diğer yollar için özel bir şey yapmayacaksan:
  return NextResponse.next();
}

// middleware.ts (varsa)
export const config = {
  matcher: [
    // webhook ve migrate hariç
    "/((?!api/webhook|api/migrate|_next/static|_next/image|favicon.ico).*)",
  ],
};

