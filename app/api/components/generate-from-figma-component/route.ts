import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById } from "@/lib/supabase/db";
import {
  createComponent,
  getComponentBySlug,
  getComponentsByProject,
  nameToComponentSlug,
} from "@/lib/supabase/components";
import { transpileTsx } from "@/lib/transpile";
import { logEvent } from "@/lib/logging/platform-event";
import {
  ComponentGenerationError,
  generateComponent,
} from "@/lib/claude/generate-component";
import type { ExtractedToken } from "@/lib/types";

const Body = z.object({
  orgId: z.string(),
  projectId: z.string(),
  /** Name of the imported component (matches an entry in extractionData.components). */
  componentName: z.string().min(1).max(120),
});

type Phase =
  | "parse-body"
  | "auth"
  | "load-project"
  | "find-imported-component"
  | "resolve-image"
  | "load-existing-components"
  | "generate"
  | "transpile"
  | "create-component"
  | "log";

export async function POST(request: Request) {
  // Tracks which step we're in so an unexpected throw lands in the catch
  // with a useful "where" tag in the response body. Diagnoses 500s without
  // requiring server log access.
  let phase: Phase = "parse-body";
  try {
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

    const { orgId, projectId, componentName } = parsed.data;

    phase = "auth";
    const auth = await requireOrgAuth(orgId, "createProject");
    if (auth instanceof NextResponse) return auth;

    phase = "load-project";
    const project = await fetchProjectById(projectId);
    if (!project || project.orgId !== orgId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    phase = "find-imported-component";
    const importedComponent = project.extractionData?.components?.find(
      (c) => c.name === componentName
    );
    if (!importedComponent) {
      return NextResponse.json(
        { error: `Imported component "${componentName}" not found on this project` },
        { status: 404 }
      );
    }

    const tokens: ExtractedToken[] = [];
    if (project.extractionData?.tokens) {
      const t = project.extractionData.tokens;
      tokens.push(...t.colors, ...t.typography, ...t.spacing, ...t.radius, ...t.effects);
    }

    phase = "resolve-image";
    const imageData = importedComponent.imageUrl
      ? await fetchImageAsBase64(importedComponent.imageUrl)
      : null;

    const layoutMdExcerpt = project.layoutMd
      ? project.layoutMd.slice(0, 8000)
      : undefined;

    // Load other generated components on this project so the model can
    // compose against them instead of inlining duplicate buttons / icons /
    // etc. with mismatched tokens.
    phase = "load-existing-components";
    const allSaved = await getComponentsByProject(orgId, projectId);
    const existingComponents = allSaved
      .filter(
        (c) =>
          c.source === "figma" &&
          c.editSchema !== null &&
          c.name !== componentName
      )
      .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
      .slice(0, 8)
      .map((c) => ({
        name: c.name,
        codeSnippet: c.code.slice(0, 800),
        variantAxes: c.editSchema?.variants,
      }));

    phase = "generate";
    let result;
    try {
      result = await generateComponent({
        component: importedComponent,
        tokens,
        layoutMdExcerpt,
        imageData: imageData ?? undefined,
        existingComponents,
      });
    } catch (err) {
      if (err instanceof ComponentGenerationError) {
        return NextResponse.json(
          { error: err.message, rawModelOutput: err.rawModelOutput, where: phase },
          { status: 502 }
        );
      }
      throw err;
    }

    phase = "create-component";
    let slug = nameToComponentSlug(componentName);
    if (await getComponentBySlug(orgId, slug, projectId)) {
      let suffix = 2;
      while (await getComponentBySlug(orgId, `${slug}-${suffix}`, projectId)) {
        suffix++;
      }
      slug = `${slug}-${suffix}`;
    }

    phase = "transpile";
    let compiledJs: string | undefined;
    try {
      compiledJs = await transpileTsx(result.code);
    } catch {
      // Non-fatal — drawer falls back to raw code view.
    }

    phase = "create-component";
    const component = await createComponent({
      orgId,
      projectId,
      name: componentName,
      slug,
      code: result.code,
      compiledJs,
      description: importedComponent.description,
      category: "imported",
      source: "figma",
      designType: "component",
      createdBy: auth.userId,
      editSchema: result.editSchema,
      linkedComponentName: componentName,
    });

    if (!component) {
      return NextResponse.json(
        { error: "Failed to save generated component", where: phase },
        { status: 500 }
      );
    }

    phase = "log";
    void logEvent("component.generated_from_figma", "studio", {
      userId: auth.userId,
      orgId,
      metadata: {
        componentName,
        projectId,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (err) {
    // Surface the actual failure to the client so we can debug from the
    // browser Network tab without needing server log access.
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(
      `[generate-from-figma-component] failed at phase=${phase}:`,
      message,
      stack ?? ""
    );
    return NextResponse.json(
      { error: message, where: phase },
      { status: 500 }
    );
  }
}

const SUPPORTED_IMAGE_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

/**
 * Resolve a Layout proxy URL ("/api/storage/<bucket>/<path>") to its public
 * Supabase Storage URL, download the bytes, and base64-encode them. Used to
 * pass component thumbnails to Claude inline — sending the proxy URL itself
 * fails on private deployments (staging is behind HTTP basic auth) because
 * Anthropic can't fetch the image.
 *
 * Returns null on any failure so the caller can fall back to text-only
 * generation rather than 500'ing the whole request.
 */
async function fetchImageAsBase64(
  url: string
): Promise<{ base64: string; mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif" } | null> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const PROXY_PREFIX = "/api/storage/";
  let fetchUrl = url;
  if (url.startsWith(PROXY_PREFIX) && SUPABASE_URL) {
    const storagePath = url.slice(PROXY_PREFIX.length);
    fetchUrl = `${SUPABASE_URL}/storage/v1/object/public/${storagePath}`;
  }
  try {
    const res = await fetch(fetchUrl);
    if (!res.ok) return null;
    const contentType = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim();
    if (!SUPPORTED_IMAGE_MIME.has(contentType)) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { base64, mediaType: contentType as "image/png" | "image/jpeg" | "image/webp" | "image/gif" };
  } catch {
    return null;
  }
}
