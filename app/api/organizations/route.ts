import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-context";
import {
  ensurePersonalOrg,
  getUserOrganizations,
} from "@/lib/supabase/organization";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  // Ensure user has a personal org
  await ensurePersonalOrg(userId);

  const organizations = await getUserOrganizations(userId);
  return NextResponse.json(organizations);
}
