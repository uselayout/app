import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { requireAuth } from "@/lib/api/auth-context";
import { getOrgMember } from "@/lib/supabase/organization";
import type { OrgRole } from "@/lib/types/organization";

interface ProjectAuthResult {
  userId: string;
  orgId: string;
  role: OrgRole;
}

/**
 * Verify the current user has access to a project via org membership.
 * Looks up the project's org_id, then checks membership.
 */
export async function requireProjectAccess(
  projectId: string
): Promise<ProjectAuthResult | NextResponse> {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { data, error } = await supabase
    .from("layout_projects")
    .select("org_id")
    .eq("id", projectId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const orgId = data.org_id as string;
  const member = await getOrgMember(orgId, authResult.userId);
  if (!member) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  return { userId: authResult.userId, orgId, role: member.role };
}
