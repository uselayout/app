import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getOrganization } from "@/lib/supabase/organization";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
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

  const { screenshot } = parsed.data;

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

  // Use the most recently updated project (fetchAllProjects orders by updated_at desc)
  const project = projects[0];

  // Append screenshot to existing array, keeping only the last 10
  const existingScreenshots = project.extractionData?.screenshots ?? [];
  const updatedScreenshots = [...existingScreenshots, screenshot].slice(-10);

  const updatedProject: Project = {
    ...project,
    extractionData: {
      sourceType: project.extractionData?.sourceType ?? "figma",
      sourceName: project.extractionData?.sourceName ?? project.name,
      sourceUrl: project.extractionData?.sourceUrl,
      tokens: project.extractionData?.tokens ?? {
        colors: [],
        typography: [],
        spacing: [],
        radius: [],
        effects: [],
      },
      components: project.extractionData?.components ?? [],
      screenshots: updatedScreenshots,
      fonts: project.extractionData?.fonts ?? [],
      animations: project.extractionData?.animations ?? [],
      librariesDetected: project.extractionData?.librariesDetected ?? {},
      cssVariables: project.extractionData?.cssVariables ?? {},
      computedStyles: project.extractionData?.computedStyles ?? {},
    },
    updatedAt: new Date().toISOString(),
  };

  await upsertProject(updatedProject, org.ownerId);

  const origin = new URL(request.url).origin;
  const url = `${origin}/studio/${project.id}?tab=explorer&source=figma`;

  return NextResponse.json(
    { explorationId: project.id, url },
    { headers: CORS }
  );
}
