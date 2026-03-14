import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from "@/lib/supabase/templates";

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  previewImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFree: z.boolean().optional(),
  priceCents: z.number().int().min(0).optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().url().optional(),
});

export async function PATCH(
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateTemplate(templateId, parsed.data);

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

  await deleteTemplate(templateId);
  return new NextResponse(null, { status: 204 });
}
