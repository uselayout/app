import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveBearerAdmin } from "@/lib/api/admin-bearer";

/**
 * True if `email` is in the ADMIN_EMAIL allow-list. Cheap and synchronous —
 * for routes that already hold a session and just need to decide whether to
 * relax a limit (e.g. skip the hourly extraction cap for staff).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function requireAdmin(
  request?: NextRequest
): Promise<{ userId: string; email: string } | NextResponse> {
  const requestHeaders = request ? request.headers : await headers();

  // Bearer-token path mirrors requireAuth(): a valid ADMIN_API_KEY resolves
  // straight to the admin user without a session cookie.
  const bearerAdmin = await resolveBearerAdmin(requestHeaders);
  if (bearerAdmin) {
    return { userId: bearerAdmin.id, email: bearerAdmin.email };
  }

  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0 || !adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: session.user.id, email: session.user.email };
}
