import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getComponentCategories } from "@/lib/supabase/components";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const categories = await getComponentCategories(orgId);
  return NextResponse.json(categories);
}
