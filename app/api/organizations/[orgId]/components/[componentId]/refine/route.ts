import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getComponent, getComponentsByProject } from "@/lib/supabase/components";
import { fetchProjectById } from "@/lib/supabase/db";
import {
  ComponentGenerationError,
} from "@/lib/claude/generate-component";
import { refineComponent } from "@/lib/claude/refine-component";
import { checkQuota, deductCredit, refundCredit } from "@/lib/billing/credits";
import { logEvent } from "@/lib/logging/platform-event";
import type { ExtractedToken } from "@/lib/types";

const Body = z.object({
  instruction: z.string().min(1).max(500),
});

const REFINE_CREDIT_TYPE = "edit" as const;
const REFINE_CREDIT_COST = 1;

/**
 * Apply a natural-language refinement to a saved Component without a full
 * regenerate. The user types a short instruction in the inspector's chat
 * input ("make the corners smaller") and we return the updated TSX + schema
 * for the client to preview. Persistence happens through the existing PATCH
 * + Save flow — refine doesn't auto-commit.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string; componentId: string }> }
) {
  const { orgId, componentId } = await params;

  const auth = await requireOrgAuth(orgId, "editProject");
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const component = await getComponent(componentId);
  if (!component || component.orgId !== orgId) {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }
  if (!component.editSchema) {
    return NextResponse.json(
      { error: "Component has no editSchema — refine is only supported for AI-generated components" },
      { status: 400 }
    );
  }
  if (!component.projectId) {
    return NextResponse.json(
      { error: "Component is not bound to a project" },
      { status: 400 }
    );
  }

  const project = await fetchProjectById(component.projectId);
  if (!project || project.orgId !== orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const tokens: ExtractedToken[] = [];
  if (project.extractionData?.tokens) {
    const t = project.extractionData.tokens;
    tokens.push(...t.colors, ...t.typography, ...t.spacing, ...t.radius, ...t.effects);
  }

  // Same composition / token-pinning approach as the main generate endpoint:
  // load peer components so the AI has compose context, pin their tokens.
  const allSaved = await getComponentsByProject(orgId, component.projectId);
  const pinnedTokenVars = new Set<string>();
  for (const c of allSaved) {
    if (c.id === componentId) continue;
    if (c.source !== "figma" || !c.editSchema) continue;
    const matches = c.code.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g);
    for (const m of matches) pinnedTokenVars.add(m[1]);
  }

  const layoutMdExcerpt = project.layoutMd
    ? project.layoutMd.slice(0, 8000)
    : undefined;

  // Billing — BYOK header takes precedence; otherwise charge hosted credits.
  // Refund on any error so failed refinements don't burn the user's quota.
  const userApiKey = request.headers.get("X-Api-Key") || undefined;
  const useByok = !!(userApiKey && userApiKey.startsWith("sk-ant-"));
  let creditDeducted = false;
  let effectiveApiKey = userApiKey;
  if (!useByok) {
    const quota = await checkQuota(auth.userId, REFINE_CREDIT_TYPE, REFINE_CREDIT_COST);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402 }
      );
    }
    const deducted = await deductCredit(auth.userId, REFINE_CREDIT_TYPE, REFINE_CREDIT_COST);
    if (!deducted) {
      return NextResponse.json(
        { error: "No credits remaining.", code: "QUOTA_EXCEEDED" },
        { status: 402 }
      );
    }
    creditDeducted = true;
    effectiveApiKey = process.env.ANTHROPIC_API_KEY;
  }

  try {
    const result = await refineComponent({
      code: component.code,
      editSchema: component.editSchema,
      instruction: parsed.data.instruction,
      tokens,
      pinnedTokenVars: Array.from(pinnedTokenVars),
      layoutMdExcerpt,
      apiKey: effectiveApiKey,
    });

    void logEvent("component.refined", "studio", {
      userId: auth.userId,
      orgId,
      metadata: {
        componentId,
        instructionLength: parsed.data.instruction.length,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    });

    return NextResponse.json({
      code: result.code,
      editSchema: result.editSchema,
    });
  } catch (err) {
    if (creditDeducted) {
      await refundCredit(auth.userId, REFINE_CREDIT_TYPE).catch(() => {});
    }
    if (err instanceof ComponentGenerationError) {
      return NextResponse.json(
        { error: err.message, rawModelOutput: err.rawModelOutput },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Refine failed";
    console.error(`[components/${componentId}/refine] failed:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
