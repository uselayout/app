import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { deleteKit, fetchKitBySlug } from "@/lib/supabase/kits";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; slug: string }> }
) {
  const { orgId, slug } = await params;
  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;
  const { orgId: resolvedOrgId } = authResult;

  const kit = await fetchKitBySlug(slug);
  if (!kit) {
    return NextResponse.json({ error: "Kit not found" }, { status: 404 });
  }
  if (kit.author.orgId !== resolvedOrgId) {
    return NextResponse.json({ error: "Only the author org can delete this kit" }, { status: 403 });
  }

  const ok = await deleteKit(kit.id, resolvedOrgId);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
  return NextResponse.json({ deleted: true });
}
