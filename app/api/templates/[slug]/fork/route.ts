import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireOrgAuth } from "@/lib/api/auth-context";
import { getTemplateBySlug } from "@/lib/supabase/templates";
import { forkTemplate } from "@/lib/marketplace/fork";

const ForkSchema = z.object({
  orgId: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Require logged-in user
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ForkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify user has editProject permission on target org
  const orgAuth = await requireOrgAuth(parsed.data.orgId, "editProject");
  if (orgAuth instanceof NextResponse) return orgAuth;

  // Resolve template by slug
  const template = await getTemplateBySlug(slug);
  if (!template) {
    return NextResponse.json(
      { error: "Template not found" },
      { status: 404 }
    );
  }

  try {
    const result = await forkTemplate(
      template.id,
      parsed.data.orgId,
      authResult.userId
    );
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fork template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
