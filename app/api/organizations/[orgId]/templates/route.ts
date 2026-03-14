import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  createTemplate,
  getTemplatesByOrg,
  updateTemplateCounts,
} from "@/lib/supabase/templates";

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  authorName: z.string().optional(),
  authorUrl: z.string().url().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageOrg");
  if (authResult instanceof NextResponse) return authResult;

  const templates = await getTemplatesByOrg(orgId);
  return NextResponse.json(templates);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "manageOrg");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const template = await createTemplate({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    longDescription: parsed.data.longDescription,
    sourceOrgId: orgId,
    category: parsed.data.category,
    tags: parsed.data.tags,
    authorName: parsed.data.authorName,
    authorUrl: parsed.data.authorUrl,
  });

  if (!template) {
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }

  // Update counts from source org assets
  await updateTemplateCounts(template.id, orgId);

  // Re-fetch to include updated counts
  const { getTemplateById } = await import("@/lib/supabase/templates");
  const updated = await getTemplateById(template.id);

  return NextResponse.json(updated, { status: 201 });
}
