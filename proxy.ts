import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isMaintenanceMode } from "@/lib/maintenance";

// All /api/ routes handle their own auth and return JSON 401 responses.
// Redirecting them to /login would return HTML, breaking client-side JSON parsing.
const PUBLIC_PATHS = ["/login", "/signup", "/request-access", "/forgot-password", "/reset-password", "/api/", "/docs", "/pricing", "/invite", "/showcase", "/terms", "/privacy", "/changelog", "/roadmap"];

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

  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null = null;
  let sessionError: string | null = null;
  try {
    session = await auth.api.getSession({ headers: request.headers });
  } catch (err) {
    sessionError = err instanceof Error ? err.message : String(err);
    // Surface the real reason in server logs so "silent logout" incidents
    // leave a trace to investigate.
    console.error(`[proxy] session lookup failed for ${pathname}:`, sessionError);
  }

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    // Tell the login page which kind of session miss this was. `error` covers
    // the thrown-exception case (likely env / DB), `expired` the benign
    // no-cookie case. The login page can render different copy for each.
    loginUrl.searchParams.set("reason", sessionError ? "error" : "expired");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|mov)$).*)",
  ],
};
