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

const TokenEntrySchema = z.object({
  name: z.string(),
  value: z.string(),
  cssVariable: z.string().optional(),
  category: z.string().optional(),
});

const ComponentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  variants: z.number().optional(),
  props: z.array(z.string()).optional(),
});

const PushSchema = z.object({
  tokens: z.object({
    colors: z.array(TokenEntrySchema).default([]),
    typography: z.array(TokenEntrySchema).default([]),
    spacing: z.array(TokenEntrySchema).default([]),
    radius: z.array(TokenEntrySchema).default([]),
    effects: z.array(TokenEntrySchema).default([]),
  }),
  components: z.array(ComponentSchema).default([]),
  fileName: z.string().optional(),
  fileKey: z.string().optional(),
  projectId: z.string().optional(),
  projectName: z.string().optional(),
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

  const parsed = PushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS }
    );
  }

  const { tokens, components, fileName, fileKey, projectId: requestedProjectId, projectName } = parsed.data;

  // Get org to obtain the owner's userId (needed for project upsert)
  const org = await getOrganization(auth.orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404, headers: CORS });
  }

  const tokenCount =
    tokens.colors.length +
    tokens.typography.length +
    tokens.spacing.length +
    tokens.radius.length +
    tokens.effects.length;

  // Find or create the project
  let project: Project | null = null;

  if (requestedProjectId) {
    // Caller specified a project — verify it belongs to this org
    const projects = await fetchAllProjects(auth.orgId);
    project = projects.find((p) => p.id === requestedProjectId) ?? null;
  }

  if (!project) {
    // Try to find an existing Figma project with the same file name
    const projects = await fetchAllProjects(auth.orgId);
    const name = projectName ?? fileName ?? "Figma Design System";

    if (fileKey) {
      project = projects.find((p) => p.sourceType === "figma" && p.sourceUrl === fileKey) ?? null;
    }
    if (!project && fileName) {
      project = projects.find((p) => p.sourceType === "figma" && p.name === name) ?? null;
    }

    if (!project) {
      // Create a new project
      const now = new Date().toISOString();
      project = {
        id: crypto.randomUUID(),
        orgId: auth.orgId,
        name,
        sourceType: "figma",
        sourceUrl: fileKey,
        layoutMd: "",
        tokenCount,
        createdAt: now,
        updatedAt: now,
      };
    }
  }

  // Map plugin token entries to server's ExtractedToken shape (adds required type/category fields)
  const mapTokens = (
    entries: typeof tokens.colors,
    type: "color" | "typography" | "spacing" | "radius" | "effect"
  ) =>
    entries.map((t) => ({
      name: t.name,
      value: t.value,
      type,
      category: "primitive" as const,
      cssVariable: t.cssVariable,
    }));

  // Update extraction data and token count
  const updatedProject: Project = {
    ...project,
    tokenCount,
    sourceUrl: fileKey ?? project.sourceUrl,
    extractionData: {
      sourceType: "figma",
      sourceName: fileName ?? project.name,
      sourceUrl: fileKey,
      tokens: {
        colors: mapTokens(tokens.colors, "color"),
        typography: mapTokens(tokens.typography, "typography"),
        spacing: mapTokens(tokens.spacing, "spacing"),
        radius: mapTokens(tokens.radius, "radius"),
        effects: mapTokens(tokens.effects, "effect"),
        motion: [],
      },
      components: components.map((c) => ({
        name: c.name,
        description: c.description,
        variantCount: c.variants ?? 1,
      })),
      screenshots: [],
      fonts: [],
      animations: [],
      librariesDetected: {},
      cssVariables: {},
      computedStyles: {},
    },
    updatedAt: new Date().toISOString(),
  };

  await upsertProject(updatedProject, org.ownerId);

  const origin = new URL(request.url).origin;
  const url = `${origin}/studio/${updatedProject.id}`;

  void logEvent("plugin.figma.push_tokens", "figma-plugin", { orgId: auth.orgId, metadata: { tokenCount, componentCount: components.length, fileKey } });

  return NextResponse.json(
    { projectId: updatedProject.id, url },
    { headers: CORS }
  );
}
