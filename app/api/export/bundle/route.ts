import { NextRequest } from "next/server";
import { z } from "zod/v4";
import JSZip from "jszip";
import { generateClaudeMd } from "@/lib/export/claude-md";
import { generateAgentsMd } from "@/lib/export/agents-md";
import { generateCursorRules } from "@/lib/export/cursor-rules";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { generateTailwindConfig } from "@/lib/export/tailwind-config";
import type { Project, ExportFormat } from "@/lib/types";

const RequestSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    sourceType: z.enum(["figma", "website", "manual"]),
    sourceUrl: z.string().optional(),
    designMd: z.string(),
    extractionData: z.unknown().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    tokenCount: z.number().optional(),
    healthScore: z.number().optional(),
  }),
  formats: z.array(
    z.enum([
      "claude-md",
      "cursor-rules",
      "agents-md",
      "tokens-css",
      "tokens-json",
      "tailwind-config",
    ])
  ),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { project, formats } = parsed.data;
  const zip = new JSZip();

  // Always include DESIGN.md
  zip.file("DESIGN.md", project.designMd);

  const proj = project as Project;

  for (const format of formats) {
    addFormatToZip(zip, format, proj);
  }

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });
  const safeName = project.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName}-ai-kit.zip"`,
    },
  });
}

function addFormatToZip(zip: JSZip, format: ExportFormat, project: Project) {
  switch (format) {
    case "claude-md": {
      zip.file("CLAUDE.md", generateClaudeMd(project));
      break;
    }
    case "agents-md": {
      zip.file("AGENTS.md", generateAgentsMd(project));
      break;
    }
    case "cursor-rules": {
      const rules = generateCursorRules(project);
      const cursorDir = zip.folder(".cursor/rules");
      cursorDir?.file("design-system.mdc", rules.designSystem);
      cursorDir?.file("components.mdc", rules.components);
      break;
    }
    case "tokens-css": {
      if (project.extractionData?.tokens) {
        zip.file("tokens.css", generateTokensCss(project.extractionData.tokens));
      }
      break;
    }
    case "tokens-json": {
      if (project.extractionData?.tokens) {
        zip.file("tokens.json", generateTokensJson(project.extractionData.tokens));
      }
      break;
    }
    case "tailwind-config": {
      if (project.extractionData?.tokens) {
        zip.file(
          "tailwind.config.js",
          generateTailwindConfig(project.extractionData.tokens)
        );
      }
      break;
    }
  }
}
