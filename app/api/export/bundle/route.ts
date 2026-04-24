import { NextRequest } from "next/server";
import { z } from "zod/v4";
import JSZip from "jszip";
import { auth } from "@/lib/auth";
import { generateClaudeMd } from "@/lib/export/claude-md";
import { generateAgentsMd } from "@/lib/export/agents-md";
import { generateCursorRules } from "@/lib/export/cursor-rules";
import { generateTokensCss } from "@/lib/export/tokens-css";
import { generateTokensJson } from "@/lib/export/tokens-json";
import { generateTailwindConfig } from "@/lib/export/tailwind-config";
import { logEvent } from "@/lib/logging/platform-event";
import { buildCuratedExtractedTokens } from "@/lib/tokens/curated-to-extracted";
import { deriveLayoutMd } from "@/lib/layout-md/derive";
import { generateDesignMd } from "@/lib/export/design-md";
import type { Project, ExportFormat, UploadedFont, BrandingAsset, ContextDocument } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const RequestSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    sourceType: z.enum(["figma", "website", "manual"]),
    sourceUrl: z.string().optional(),
    layoutMd: z.string(),
    extractionData: z.unknown().optional(),
    uploadedFonts: z.array(z.object({
      id: z.string(),
      family: z.string(),
      weight: z.string(),
      style: z.string(),
      format: z.enum(["woff2", "woff", "ttf", "otf"]),
      url: z.string(),
      projectId: z.string(),
      orgId: z.string().optional(),
    })).optional(),
    brandingAssets: z.array(z.object({
      id: z.string(),
      slot: z.enum(["primary", "secondary", "wordmark", "favicon", "mark", "other"]),
      variant: z.enum(["colour", "white", "black", "mono"]).optional(),
      url: z.string(),
      name: z.string(),
      mimeType: z.string(),
      size: z.number(),
      uploadedAt: z.string(),
    })).optional(),
    contextDocuments: z.array(z.object({
      id: z.string(),
      name: z.string(),
      content: z.string(),
      mimeType: z.string(),
      size: z.number(),
      addedAt: z.string(),
      pinned: z.boolean().optional(),
    })).optional(),
    // Standardisation MUST be declared or Zod strips it — the exported
    // layout.md runs through deriveLayoutMd, which uses it to regenerate
    // the CORE TOKENS block.
    standardisation: z.unknown().optional(),
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
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

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

  const proj = project as Project;

  // Run the client-supplied project through the derive engine so the zipped
  // layout.md matches what MCP and the Explorer see: fresh CORE TOKENS from
  // the curated assignments, fresh Appendix A from the extracted tokens.
  const derivedLayoutMd = deriveLayoutMd(proj);
  zip.file("layout.md", derivedLayoutMd);

  // Companion design.md for agents that follow Google's design.md spec. Same
  // tokens, same prose, different frontmatter shape. layout.md stays canonical.
  zip.file(
    "design.md",
    generateDesignMd({
      name: proj.name,
      layoutMd: derivedLayoutMd,
      extractionData: proj.extractionData,
    })
  );

  for (const format of formats) {
    addFormatToZip(zip, format, proj);
  }

  // Include screenshots if available (stored as Supabase Storage URLs)
  if (proj.extractionData?.screenshots?.length) {
    const screenshotDir = zip.folder("screenshots");
    const names = ["full-page.png", "viewport.png"];

    await Promise.all(
      proj.extractionData.screenshots.map(async (urlOrDataUri, i) => {
        try {
          let buffer: ArrayBuffer;
          if (urlOrDataUri.startsWith("data:")) {
            // Base64 data URI (in-session, not yet uploaded)
            const base64 = urlOrDataUri.replace(/^data:image\/\w+;base64,/, "");
            buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
          } else {
            // Supabase Storage URL
            const res = await fetch(urlOrDataUri);
            if (!res.ok) return;
            buffer = await res.arrayBuffer();
          }
          screenshotDir?.file(names[i] ?? `screenshot-${i}.png`, buffer);
        } catch {
          // Skip failed screenshot downloads
        }
      })
    );
  }

  // Include uploaded font files
  const uploadedFonts = (proj.uploadedFonts ?? []) as UploadedFont[];
  if (uploadedFonts.length > 0) {
    const fontsDir = zip.folder("fonts");
    const fontFaceRules: string[] = [];

    await Promise.all(
      uploadedFonts.map(async (font) => {
        try {
          // Font URLs are proxy paths like /api/storage/layout-fonts/...
          // Resolve to Supabase direct URL for server-side fetch
          const storagePath = font.url.replace(/^\/api\/storage\//, "");
          const url = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const buffer = await res.arrayBuffer();

          const safeName = font.family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const filename = `${safeName}-${font.weight}-${font.style}.${font.format}`;
          fontsDir?.file(filename, buffer);

          const formatMap: Record<string, string> = {
            woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype",
          };
          fontFaceRules.push(
            `@font-face {\n  font-family: "${font.family}";\n  src: url("./${filename}") format("${formatMap[font.format] ?? "woff2"}");\n  font-weight: ${font.weight};\n  font-style: ${font.style};\n  font-display: swap;\n}`
          );
        } catch {
          // Skip failed font downloads
        }
      })
    );

    if (fontFaceRules.length > 0) {
      fontsDir?.file("fonts.css", fontFaceRules.join("\n\n") + "\n");
    }
  }

  // Include branding assets: fetch each from the Supabase URL and write into
  // a branding/ folder alongside an index.json mapping slot -> filename so
  // downstream consumers (CLI / MCP) can resolve data-brand-logo="..." slots.
  const brandingAssets = (proj.brandingAssets ?? []) as BrandingAsset[];
  if (brandingAssets.length > 0) {
    const brandingDir = zip.folder("branding");
    const manifest: Record<string, { filename: string; slot: string; url: string; mimeType: string }> = {};

    await Promise.all(
      brandingAssets.map(async (asset) => {
        try {
          const storagePath = asset.url.replace(/^\/api\/storage\//, "");
          const url = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;
          const res = await fetch(url);
          if (!res.ok) return;
          const buffer = await res.arrayBuffer();
          const ext = asset.name.includes(".")
            ? asset.name.split(".").pop()
            : undefined;
          const safeName = asset.name
            .toLowerCase()
            .replace(/[^a-z0-9.]+/g, "-");
          const filename = `${asset.slot}-${asset.id}${ext ? "" : ""}-${safeName}`;
          brandingDir?.file(filename, buffer);
          manifest[asset.id] = {
            filename,
            slot: asset.slot,
            url: asset.url,
            mimeType: asset.mimeType,
          };
        } catch {
          // Skip failed downloads; continue bundling.
        }
      })
    );

    brandingDir?.file("index.json", JSON.stringify(manifest, null, 2));
  }

  // Include context documents: one .md per doc + a lightweight index.json.
  const contextDocuments = (proj.contextDocuments ?? []) as ContextDocument[];
  if (contextDocuments.length > 0) {
    const contextDir = zip.folder("context");
    const manifest: Record<string, { name: string; pinned: boolean; mimeType: string; addedAt: string }> = {};

    for (const doc of contextDocuments) {
      const safeName = doc.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const filename = safeName.endsWith(".md") || safeName.endsWith(".txt")
        ? safeName
        : `${safeName}.md`;
      contextDir?.file(filename, doc.content);
      manifest[doc.id] = {
        name: filename,
        pinned: Boolean(doc.pinned),
        mimeType: doc.mimeType,
        addedAt: doc.addedAt,
      };
    }

    contextDir?.file("index.json", JSON.stringify(manifest, null, 2));
  }

  void logEvent("export.bundle", "studio", {
    userId: session.user.id,
    metadata: {
      formats,
      projectId: project.id,
      hasScreenshots: !!proj.extractionData?.screenshots?.length,
      fontCount: uploadedFonts.length,
      brandingCount: brandingAssets.length,
      contextDocCount: contextDocuments.length,
    },
  });

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
        const tokens = buildCuratedExtractedTokens(project.standardisation) ?? project.extractionData.tokens;
        const out = generateTokensCss(tokens);
        if (out.length > 0) zip.file("tokens.css", out);
      }
      break;
    }
    case "tokens-json": {
      if (project.extractionData?.tokens) {
        const tokens = buildCuratedExtractedTokens(project.standardisation) ?? project.extractionData.tokens;
        const out = generateTokensJson(tokens);
        if (out.length > 0) zip.file("tokens.json", out);
      }
      break;
    }
    case "tailwind-config": {
      if (project.extractionData?.tokens) {
        const tokens = buildCuratedExtractedTokens(project.standardisation) ?? project.extractionData.tokens;
        zip.file(
          "tailwind.config.js",
          generateTailwindConfig(tokens, project.extractionData.breakpoints)
        );
      }
      break;
    }
  }
}
