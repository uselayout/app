import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireProjectAccess } from "@/lib/api/project-context";
import { fetchProjectById } from "@/lib/supabase/db";
import { checkCompliance, complianceScore } from "@/lib/compliance/rules";
import type { ComplianceKit } from "@/lib/compliance/rules";
import { buildCuratedExtractedTokens } from "@/lib/tokens/curated-to-extracted";
import { generateTokensCss } from "@/lib/export/tokens-css";

const RequestSchema = z.object({
  code: z.string().min(1).max(200_000),
  projectId: z.string().min(1),
});

/**
 * Runs the design-system compliance rules (same set as the CLI's
 * check-compliance MCP tool — see lib/compliance/rules.ts) against a code
 * snippet, using the project's tokens and extracted components as the kit.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { code, projectId } = parsed.data;

  const access = await requireProjectAccess(projectId);
  if (access instanceof NextResponse) return access;

  const project = await fetchProjectById(projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Build the kit the rules run against. Prefer curated tokens (what exports
  // ship), fall back to raw extracted tokens, then to layout.md itself — the
  // token-reference rule only needs `--name:` definitions, which the CORE
  // TOKENS block in layout.md provides.
  const tokens =
    buildCuratedExtractedTokens(project.standardisation) ??
    project.extractionData?.tokens;
  const tokensCss = tokens ? generateTokensCss(tokens) : "";

  const kit: ComplianceKit = {
    tokensCss: tokensCss.length > 0 ? tokensCss : project.layoutMd || undefined,
    components:
      project.extractionData?.components?.map((c) => ({ name: c.name })) ?? [],
  };

  const result = checkCompliance(code, kit);

  return NextResponse.json({
    score: complianceScore(result.issues),
    passed: result.passed,
    summary: result.summary,
    findings: result.issues.map((issue) => ({
      ruleId: issue.ruleId,
      ruleName: issue.ruleName,
      severity: issue.severity,
      message: issue.message,
      line: issue.line,
    })),
  });
}
