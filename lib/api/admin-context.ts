import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { resolveBearerAdmin } from "@/lib/api/admin-bearer";

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
