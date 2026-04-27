import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

// Lightweight client-facing admin check. Returns { isAdmin: boolean } without
// ever 403-ing so UI code doesn't have to handle a failure path to decide
// whether to show admin-only controls. Admin bypass is still enforced on the
// actual admin write routes via requireAdmin.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) {
    return NextResponse.json({ isAdmin: false });
  }

  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    adminEmails.length > 0 && adminEmails.includes(session.user.email.toLowerCase());
  return NextResponse.json({ isAdmin });
}
