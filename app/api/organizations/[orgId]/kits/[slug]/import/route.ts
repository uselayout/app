import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchKitBySlug, incrementImportCount } from "@/lib/supabase/kits";
import { upsertProject } from "@/lib/supabase/db";
import { projectFromKit } from "@/lib/kits/from-project";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; slug: string }> }
) {
  const { orgId, slug } = await params;
  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;
  const { userId, orgId: resolvedOrgId } = authResult;

  const kit = await fetchKitBySlug(slug);
  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }

  const newProjectId = crypto.randomUUID();
  const project = projectFromKit(kit, resolvedOrgId, newProjectId);

  await upsertProject(project, userId);
  void incrementImportCount(kit.id);

  return NextResponse.json({
    projectId: newProjectId,
    kitId: kit.id,
  });
}
