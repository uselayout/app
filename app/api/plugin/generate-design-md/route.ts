import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getOrganization } from "@/lib/supabase/organization";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
import { createDesignMdStream } from "@/lib/claude/synthesise";
import { logUsage } from "@/lib/billing/usage";
import type { Project, ExtractionResult } from "@/lib/types";

export const maxDuration = 120;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
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
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const { stream, usage } = createDesignMdStream(extractionData, apiKey);

  // Collect the full stream into a string
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let designMd = "";

  try {
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        designMd += decoder.decode(result.value, { stream: !done });
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Save to project
  const updatedProject: Project = {
    ...project,
    designMd,
    updatedAt: new Date().toISOString(),
  };
  await upsertProject(updatedProject, org.ownerId);

  // Log usage (fire-and-forget)
  void usage
    .then((u) =>
      logUsage({
        userId: auth.userId,
        projectId,
        endpoint: "design-md",
        mode: "hosted",
        usage: u,
        model: "claude-sonnet-4-6",
      }),
    )
    .catch((err) => console.error("Usage logging failed:", err));

  const url = `/studio/${projectId}`;

  return NextResponse.json(
    { success: true, url },
    { headers: CORS },
  );
}
