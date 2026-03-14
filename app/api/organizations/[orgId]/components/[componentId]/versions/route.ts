import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getComponent, getComponentVersions } from "@/lib/supabase/components";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; componentId: string }> }
) {
  const { orgId, componentId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const component = await getComponent(componentId);
  if (!component || component.orgId !== orgId) {
    return NextResponse.json(
      { error: "Component not found" },
      { status: 404 }
    );
  }

  const versions = await getComponentVersions(componentId);
  return NextResponse.json(versions);
}
