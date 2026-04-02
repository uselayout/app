import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getOrganization } from "@/lib/supabase/organization";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
import { logEvent } from "@/lib/logging/platform-event";
import type { Project } from "@/lib/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const PushToCanvasSchema = z.object({
  screenshot: z.string(),
  projectId: z.string().optional(),
  tokens: z.record(z.string(), z.unknown()).optional(),
  componentName: z.string().optional(),
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

  const parsed = PushToCanvasSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS }
    );
  }

  const { screenshot, projectId } = parsed.data;

  // Get org to obtain the owner's userId (needed for project upsert)
  const org = await getOrganization(auth.orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404, headers: CORS });
  }

  const projects = await fetchAllProjects(auth.orgId);
  if (!projects.length) {
    return NextResponse.json(
      { error: "No projects found - please extract a design system first" },
      { status: 404, headers: CORS }
    );
  }

  // Use specified project if provided, otherwise fall back to most recently updated
  const project = projectId
    ? projects.find((p) => p.id === projectId) ?? projects[0]
    : projects[0];

  // Store screenshot as pending canvas image (NOT in extractionData.screenshots)
  // extractionData.screenshots are extraction screenshots used for layout.md generation
  // pendingCanvasImage is a temporary image for Canvas variant generation
  const updatedProject: Project = {
    ...project,
    pendingCanvasImage: screenshot,
    updatedAt: new Date().toISOString(),
  };

  await upsertProject(updatedProject, org.ownerId);

  const url = `/studio/${project.id}?tab=explorer&source=figma`;

  void logEvent("plugin.figma.push", "figma-plugin", { orgId: auth.orgId, metadata: { projectId: project.id } });

  return NextResponse.json(
    { explorationId: project.id, url },
    { headers: CORS }
  );
}
