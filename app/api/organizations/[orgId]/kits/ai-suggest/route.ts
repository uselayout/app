import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById } from "@/lib/supabase/db";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { deriveLayoutMd } from "@/lib/layout-md/derive";
import { suggestKitMeta } from "@/lib/claude/suggest-kit-meta";

const Body = z.object({
  projectId: z.string(),
});

// Lightweight AI endpoint backing the "Generate with AI" button in the
// Share-to-Gallery modal. Uses Claude Haiku (single message, ~400 output
// tokens) to turn a project's layout.md + tokens into a gallery-ready
// description and a small set of taxonomy tags.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;
  const { orgId: resolvedOrgId } = authResult;

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const project = await fetchProjectById(parsed.data.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.orgId !== resolvedOrgId) {
    return NextResponse.json({ error: "Project does not belong to this organisation" }, { status: 403 });
  }

  const tokensCss = project.extractionData
    ? generateTokensCss(project.extractionData.tokens)
    : "";
  const layoutMd = deriveLayoutMd(project);

  try {
    const suggestion = await suggestKitMeta({
      projectName: project.name,
      layoutMd,
      tokensCss,
    });
    return NextResponse.json(suggestion);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI suggestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
