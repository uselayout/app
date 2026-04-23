import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Auth configuration diagnostic. Safe to hit from the browser — reports only
 * booleans and the resolved baseURL, never secrets or user data. Gated:
 *   - locally / in any non-prod env: always accessible
 *   - in production: only accessible when AUTH_DEBUG=1 is set
 *
 * Use to triage "why am I getting logged out" incidents without needing
 * server console access. Pair with Coolify env-var inspection.
 */
export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  const debugAllowed = !isProd || process.env.AUTH_DEBUG === "1";
  if (!debugAllowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const envFlags = {
    BETTER_AUTH_URL: Boolean(process.env.BETTER_AUTH_URL),
    BETTER_AUTH_SECRET: Boolean(process.env.BETTER_AUTH_SECRET),
    NEXT_PUBLIC_APP_URL: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NODE_ENV: process.env.NODE_ENV ?? "unset",
  };
  const resolved = {
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    appURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    host: request.headers.get("host"),
    origin: request.headers.get("origin"),
    protocol: request.headers.get("x-forwarded-proto") ?? "unknown",
  };
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieNames = cookieHeader
    .split(";")
    .map((c) => c.trim().split("=")[0])
    .filter(Boolean);
  const hasSessionCookie = cookieNames.some((n) => n.includes("session"));

  let sessionStatus: { ok: true; userId: string | null } | { ok: false; error: string };
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    sessionStatus = { ok: true, userId: session?.user?.id ?? null };
  } catch (err) {
    sessionStatus = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(
    {
      env: envFlags,
      resolved,
      cookies: { names: cookieNames, hasSessionCookie },
      session: sessionStatus,
    },
    { headers: { "cache-control": "private, no-store" } }
  );
}
