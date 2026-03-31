import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isMaintenanceMode } from "@/lib/maintenance";

// All /api/ routes handle their own auth and return JSON 401 responses.
// Redirecting them to /login would return HTML, breaking client-side JSON parsing.
const PUBLIC_PATHS = ["/login", "/signup", "/request-access", "/api/", "/docs", "/pricing", "/invite", "/showcase", "/terms", "/privacy"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Maintenance mode: let health checks through, block API routes with 503
  if (isMaintenanceMode()) {
    if (pathname.startsWith("/api/health")) {
      return NextResponse.next();
    }
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          error: "maintenance",
          message:
            "Layout is undergoing scheduled maintenance. Please try again shortly.",
        },
        { status: 503, headers: { "Retry-After": "600" } }
      );
    }
    // Non-API routes: let through (layout.tsx renders MaintenancePage)
    return NextResponse.next();
  }

  // Root marketing page is always public
  if (pathname === "/") return NextResponse.next();

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)",
  ],
};
