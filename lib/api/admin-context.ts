import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function requireAdmin(
  request?: NextRequest
): Promise<{ userId: string; email: string } | NextResponse> {
  const session = await auth.api.getSession({
    headers: request ? request.headers : await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_USER_EMAIL;
  if (!adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: session.user.id, email: session.user.email };
}
