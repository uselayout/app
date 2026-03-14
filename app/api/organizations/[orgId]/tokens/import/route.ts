import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { bulkCreateTokens } from "@/lib/supabase/tokens";
import { logAuditEvent } from "@/lib/supabase/audit";
import type { DesignTokenSource } from "@/lib/types/token";

const ImportTokensSchema = z.object({
  tokens: z.array(
    z.object({
      name: z.string().min(1).max(200),
      type: z.enum(["color", "typography", "spacing", "radius", "effect", "motion"]),
      value: z.string().min(1),
      category: z.enum(["primitive", "semantic", "component"]).optional(),
      cssVariable: z.string().optional(),
      groupName: z.string().optional(),
      description: z.string().optional(),
    })
  ).min(1).max(500),
  source: z.enum(["extracted", "manual", "figma-variable"]).optional(),
});

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

  const parsed = ImportTokensSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const source = (parsed.data.source ?? "manual") as DesignTokenSource;

  const tokensWithSource = parsed.data.tokens.map((t) => ({
    ...t,
    source,
  }));

  const imported = await bulkCreateTokens(orgId, tokensWithSource);

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "token.imported",
    resourceType: "token",
    details: { count: imported, source },
  });

  return NextResponse.json({ imported }, { status: 201 });
}
