import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { fetchProjectById, fetchAllProjects } from "@/lib/supabase/db";
import { generateClaudeMd } from "@/lib/export/claude-md";
import { generateAgentsMd } from "@/lib/export/agents-md";
import { generateCursorRules } from "@/lib/export/cursor-rules";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { generateTailwindConfig } from "@/lib/export/tailwind-config";

const QuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  formats: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? v.split(",").filter(Boolean)
        : [
            "layout-md",
            "claude-md",
            "agents-md",
            "cursor-rules",
            "tokens-css",
            "tokens-json",
            "tailwind-config",
          ]
    ),
});

export async function GET(request: Request) {
  const authResult = await requireMcpAuth(request, "read");
  if (authResult instanceof NextResponse) return authResult;

  const { orgId } = authResult;

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    projectId: url.searchParams.get("projectId") ?? undefined,
    formats: url.searchParams.get("formats") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { projectId, formats } = parsed.data;

  // Fetch project — by ID or most recent
  let project;
  if (projectId) {
    project = await fetchProjectById(projectId);
    if (!project || project.orgId !== orgId) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }
  } else {
    const projects = await fetchAllProjects(orgId);
    project = projects[0];
    if (!project) {
      return NextResponse.json(
        { error: "No projects found for this organisation" },
        { status: 404 }
      );
    }
  }

  const files: Record<string, string> = {};

  // Always include layout.md if requested
  if (formats.includes("layout-md")) {
    files["layout.md"] = project.layoutMd;
  }

  if (formats.includes("claude-md")) {
    files["CLAUDE.md"] = generateClaudeMd(project);
  }

  if (formats.includes("agents-md")) {
    files["AGENTS.md"] = generateAgentsMd(project);
  }

  if (formats.includes("cursor-rules")) {
    const rules = generateCursorRules(project);
    files[".cursor/rules/design-system.mdc"] = rules.designSystem;
    files[".cursor/rules/components.mdc"] = rules.components;
  }

  const tokens = project.extractionData?.tokens;

  if (formats.includes("tokens-css") && tokens) {
    files["tokens.css"] = generateTokensCss(tokens);
  }

  if (formats.includes("tokens-json") && tokens) {
    files["tokens.json"] = generateTokensJson(tokens);
  }

  if (formats.includes("tailwind-config") && tokens) {
    files["tailwind.config.js"] = generateTailwindConfig(tokens);
  }

  return NextResponse.json({
    project: {
      id: project.id,
      name: project.name,
      sourceType: project.sourceType,
      updatedAt: project.updatedAt,
    },
    files,
  });
}
