import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById } from "@/lib/supabase/db";
import { getTokensByOrg } from "@/lib/supabase/tokens";
import {
  createDriftReport,
  getDriftReportsByOrg,
} from "@/lib/supabase/drift";
import { diffTokens } from "@/lib/drift/diff-tokens";
import type { ExtractedToken, ExtractedTokens } from "@/lib/types";
import type { DriftStatus } from "@/lib/types/drift";

const CreateDriftSchema = z.object({
  projectId: z.string().uuid(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as DriftStatus | null;

  const reports = await getDriftReportsByOrg(orgId, {
    status: status ?? undefined,
  });

  return NextResponse.json(reports);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateDriftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch the project
  const project = await fetchProjectById(parsed.data.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.orgId !== orgId) {
    return NextResponse.json(
      { error: "Project does not belong to this organisation" },
      { status: 403 }
    );
  }

  // Get extracted tokens from the project
  const extractionTokens = project.extractionData?.tokens as
    | ExtractedTokens
    | undefined;
  if (!extractionTokens) {
    return NextResponse.json(
      { error: "Project has no extraction data" },
      { status: 400 }
    );
  }

  // Flatten all extracted token arrays into one
  const allExtracted: ExtractedToken[] = [
    ...(extractionTokens.colors ?? []),
    ...(extractionTokens.typography ?? []),
    ...(extractionTokens.spacing ?? []),
    ...(extractionTokens.radius ?? []),
    ...(extractionTokens.effects ?? []),
  ];

  // Get current org tokens
  const currentTokens = await getTokensByOrg(orgId);

  // Run diff
  const changes = diffTokens(currentTokens, allExtracted);

  // Count by type
  const tokenAdditions = changes.filter((c) => c.type === "added").length;
  const tokenChanges = changes.filter((c) => c.type === "changed").length;
  const tokenRemovals = changes.filter((c) => c.type === "removed").length;

  // Generate summary
  const parts: string[] = [];
  if (tokenAdditions > 0) parts.push(`+${tokenAdditions} added`);
  if (tokenChanges > 0) parts.push(`~${tokenChanges} changed`);
  if (tokenRemovals > 0) parts.push(`-${tokenRemovals} removed`);
  const summary = parts.length > 0 ? parts.join(", ") : "No changes detected";

  // Create drift report
  const report = await createDriftReport({
    orgId,
    projectId: parsed.data.projectId,
    sourceUrl: project.sourceUrl ?? project.name,
    sourceType: project.sourceType === "figma" ? "figma" : "website",
    changes,
    summary,
    tokenAdditions,
    tokenChanges,
    tokenRemovals,
  });

  if (!report) {
    return NextResponse.json(
      { error: "Failed to create drift report" },
      { status: 500 }
    );
  }

  return NextResponse.json(report, { status: 201 });
}
