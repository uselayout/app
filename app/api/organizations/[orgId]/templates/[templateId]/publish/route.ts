import { NextResponse } from "next/server";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getTemplateById,
  publishTemplate,
  unpublishTemplate,
} from "@/lib/supabase/templates";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ orgId: string; templateId: string }> }
) {
  const { orgId, templateId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageOrg");
  if (authResult instanceof NextResponse) return authResult;

  const template = await getTemplateById(templateId);
  if (!template || template.sourceOrgId !== orgId) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  await publishTemplate(templateId);

  const updated = await getTemplateById(templateId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ orgId: string; templateId: string }> }
) {
  const { orgId, templateId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageOrg");
  if (authResult instanceof NextResponse) return authResult;

  const template = await getTemplateById(templateId);
  if (!template || template.sourceOrgId !== orgId) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  await unpublishTemplate(templateId);

  const updated = await getTemplateById(templateId);
  return NextResponse.json(updated);
}
