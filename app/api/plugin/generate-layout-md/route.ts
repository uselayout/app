import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getOrganization } from "@/lib/supabase/organization";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
import { createLayoutMdStream } from "@/lib/claude/synthesise";
import { checkQuota, deductCredit } from "@/lib/billing/credits";
import { logUsage } from "@/lib/billing/usage";
import { saveLayoutMdVersion } from "@/lib/supabase/layout-md-versions";
import type { Project, ExtractionResult } from "@/lib/types";
import { getTaskModelId } from "@/lib/ai/models";
import type { AiMode, TokenUsageResult } from "@/lib/types/billing";
import { generationLimit } from "@/lib/concurrency";

export const maxDuration = 120;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Anthropic-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const RequestSchema = z.object({
  projectId: z.string(),
});

export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400, headers: CORS },
    );
  }

  const { projectId } = parsed.data;

  const org = await getOrganization(auth.orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404, headers: CORS });
  }

  const projects = await fetchAllProjects(auth.orgId);
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return NextResponse.json(
      { error: "Project not found in this organisation" },
      { status: 403, headers: CORS },
    );
  }

  if (!project.extractionData?.tokens) {
    return NextResponse.json(
      { error: "No extraction data — extract a design system first" },
      { status: 400, headers: CORS },
    );
  }

  const extractionData = project.extractionData as unknown as ExtractionResult;

  // Determine AI mode: BYOK (user's own Anthropic key) or hosted (platform key)
  const userAnthropicKey = request.headers.get("X-Anthropic-Key") || undefined;
  let mode: AiMode;
  let apiKey: string | undefined;

  if (userAnthropicKey) {
    mode = "byok";
    apiKey = userAnthropicKey;
  } else {
    const quota = await checkQuota(auth.userId, "layout-md");
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.reason, code: "QUOTA_EXCEEDED", remaining: quota.remaining },
        { status: 402, headers: CORS },
      );
    }

    const deducted = await deductCredit(auth.userId, "layout-md");
    if (!deducted) {
      return NextResponse.json(
        { error: "No credits remaining. Top up or use your own Anthropic API key.", code: "QUOTA_EXCEEDED" },
        { status: 402, headers: CORS },
      );
    }

    mode = "hosted";
    apiKey = process.env.ANTHROPIC_API_KEY;
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured on server" },
      { status: 500, headers: CORS },
    );
  }

  let usage: Promise<TokenUsageResult> | undefined;
  const extractionModelId = await getTaskModelId("extraction");
  const layoutMd = await generationLimit(async () => {
    const { stream, usage: usagePromise } = createLayoutMdStream(extractionData, apiKey, undefined, extractionModelId);

    // Collect the full stream into a string
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let content = "";

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          content += decoder.decode(result.value, { stream: !done });
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Stash usage promise on outer scope so we can log after save
    usage = usagePromise;
    return content;
  });

  // Don't save error text as layout.md content
  if (layoutMd.includes("[Error generating layout.md:")) {
    return NextResponse.json(
      { error: layoutMd.trim() },
      { status: 500, headers: CORS },
    );
  }

  // Save previous version before overwriting
  if (project.layoutMd && project.layoutMd.length > 0) {
    await saveLayoutMdVersion(projectId, auth.orgId, project.layoutMd, "generation", auth.userId);
  }

  // Save to project
  const updatedProject: Project = {
    ...project,
    layoutMd,
    updatedAt: new Date().toISOString(),
  };
  await upsertProject(updatedProject, org.ownerId);

  // Log usage (fire-and-forget)
  if (usage) {
    void usage
      .then((u) =>
        logUsage({
          userId: auth.userId,
          projectId,
          endpoint: "layout-md",
          mode,
          usage: u,
          model: extractionModelId,
        }),
      )
      .catch((err) => console.error("Usage logging failed:", err));
  }

  const url = `/studio/${projectId}`;

  return NextResponse.json(
    { success: true, url },
    { headers: CORS },
  );
}
