import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getOrganization } from "@/lib/supabase/organization";
import { fetchAllProjects, upsertProject } from "@/lib/supabase/db";
import type { Project, ExtractedTokens, TokenType } from "@/lib/types";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const EMPTY_TOKENS = {
  colors: [],
  typography: [],
  spacing: [],
  radius: [],
  effects: [],
  motion: [],
};

/** Map server ExtractedToken[] to the plugin's expected shape */
function toPluginTokens(tokens: ExtractedTokens) {
  const map = (entries: ExtractedTokens["colors"]) =>
    entries.map((t) => ({
      name: t.name,
      value: t.value,
      cssVariable: t.cssVariable ?? null,
      mode: t.mode ?? null,
    }));

  return {
    colors: map(tokens.colors),
    typography: map(tokens.typography),
    spacing: map(tokens.spacing),
    radius: map(tokens.radius),
    effects: map(tokens.effects),
    motion: map(tokens.motion ?? []),
  };
}

// ---------------------------------------------------------------------------
// GET /api/plugin/tokens?projectId=xxx
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "read");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required" },
      { status: 400, headers: CORS }
    );
  }

  const projects = await fetchAllProjects(auth.orgId);
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return NextResponse.json(
      { error: "Project not found in this organisation" },
      { status: 403, headers: CORS }
    );
  }

  const tokens = project.extractionData?.tokens ?? EMPTY_TOKENS;

  return NextResponse.json(
    { tokens: toPluginTokens(tokens as ExtractedTokens) },
    { headers: CORS }
  );
}

// ---------------------------------------------------------------------------
// POST /api/plugin/tokens — import tokens from Figma Variables
// ---------------------------------------------------------------------------

const TokenEntrySchema = z.object({
  name: z.string(),
  value: z.string(),
  cssVariable: z.string().optional().nullable(),
  mode: z.string().optional().nullable(),
});

const ImportSchema = z.object({
  tokens: z.object({
    colors: z.array(TokenEntrySchema).default([]),
    typography: z.array(TokenEntrySchema).default([]),
    spacing: z.array(TokenEntrySchema).default([]),
    radius: z.array(TokenEntrySchema).default([]),
    effects: z.array(TokenEntrySchema).default([]),
    motion: z.array(TokenEntrySchema).default([]),
  }),
  projectId: z.string().optional(),
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

  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS }
    );
  }

  const { tokens: incoming, projectId } = parsed.data;

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400, headers: CORS }
    );
  }

  const projects = await fetchAllProjects(auth.orgId);
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return NextResponse.json(
      { error: "Project not found in this organisation" },
      { status: 403, headers: CORS }
    );
  }

  const org = await getOrganization(auth.orgId);
  if (!org) {
    return NextResponse.json({ error: "Organisation not found" }, { status: 404, headers: CORS });
  }

  // Merge incoming tokens into extraction data
  const existing = (project.extractionData?.tokens ?? EMPTY_TOKENS) as ExtractedTokens;
  const typeMap: Record<string, TokenType> = {
    colors: "color",
    typography: "typography",
    spacing: "spacing",
    radius: "radius",
    effects: "effect",
    motion: "motion",
  };

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  const mergeGroup = (
    existingArr: ExtractedTokens["colors"],
    incomingArr: typeof incoming.colors,
    type: TokenType
  ) => {
    const result = [...existingArr];

    for (const token of incomingArr) {
      const mode = token.mode ?? undefined;
      // Key on name + mode so a multi-mode variable (same name, different mode)
      // produces one token per mode rather than clobbering.
      const idx = result.findIndex(
        (t) => t.name === token.name && (t.mode ?? undefined) === mode
      );
      if (idx === -1) {
        result.push({
          name: token.name,
          value: token.value,
          type,
          category: "primitive",
          cssVariable: token.cssVariable ?? undefined,
          mode,
        });
        created++;
      } else if (result[idx].value !== token.value) {
        result[idx] = {
          ...result[idx],
          value: token.value,
          cssVariable: token.cssVariable ?? result[idx].cssVariable,
          mode,
        };
        updated++;
      } else {
        unchanged++;
      }
    }

    return result;
  };

  const mergedTokens: ExtractedTokens = {
    colors: mergeGroup(existing.colors, incoming.colors, typeMap.colors),
    typography: mergeGroup(existing.typography, incoming.typography, typeMap.typography),
    spacing: mergeGroup(existing.spacing, incoming.spacing, typeMap.spacing),
    radius: mergeGroup(existing.radius, incoming.radius, typeMap.radius),
    effects: mergeGroup(existing.effects, incoming.effects, typeMap.effects),
    motion: mergeGroup(existing.motion ?? [], incoming.motion ?? [], "motion"),
  };

  const tokenCount =
    mergedTokens.colors.length +
    mergedTokens.typography.length +
    mergedTokens.spacing.length +
    mergedTokens.radius.length +
    mergedTokens.effects.length;

  const updatedProject: Project = {
    ...project,
    tokenCount,
    pluginTokensPushedAt: new Date().toISOString(),
    extractionData: {
      ...(project.extractionData ?? {
        sourceType: "figma",
        sourceName: project.name,
        tokens: EMPTY_TOKENS,
        components: [],
        screenshots: [],
        fonts: [],
        animations: [],
        librariesDetected: {},
        cssVariables: {},
        computedStyles: {},
      }),
      tokens: mergedTokens,
    },
    updatedAt: new Date().toISOString(),
  };

  await upsertProject(updatedProject, org.ownerId);

  return NextResponse.json(
    { created, updated, unchanged, conflicts: [] },
    { headers: CORS }
  );
}
