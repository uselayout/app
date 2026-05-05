import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById } from "@/lib/supabase/db";
import {
  createComponent,
  getComponentBySlug,
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

export async function POST(request: Request) {
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

  const auth = await requireOrgAuth(orgId, "createProject");
  if (auth instanceof NextResponse) return auth;

  const project = await fetchProjectById(projectId);
  if (!project || project.orgId !== orgId) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const importedComponent = project.extractionData?.components?.find(
    (c) => c.name === componentName
  );
  if (!importedComponent) {
    return NextResponse.json(
      { error: `Imported component "${componentName}" not found on this project` },
      { status: 404 }
    );
  }

  // Flatten tokens for the prompt and resolve a relative imageUrl to absolute.
  const tokens: ExtractedToken[] = [];
  if (project.extractionData?.tokens) {
    const t = project.extractionData.tokens;
    tokens.push(...t.colors, ...t.typography, ...t.spacing, ...t.radius, ...t.effects);
  }

  let absoluteImageUrl: string | undefined;
  if (importedComponent.imageUrl) {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
    absoluteImageUrl = importedComponent.imageUrl.startsWith("http")
      ? importedComponent.imageUrl
      : `${origin}${importedComponent.imageUrl}`;
  }

  // Trim layout.md so we don't blow the context budget on huge specs.
  const layoutMdExcerpt = project.layoutMd
    ? project.layoutMd.slice(0, 8000)
    : undefined;

  let result;
  try {
    result = await generateComponent({
      component: { ...importedComponent, imageUrl: absoluteImageUrl },
      tokens,
      layoutMdExcerpt,
    });
  } catch (err) {
    if (err instanceof ComponentGenerationError) {
      return NextResponse.json(
        { error: err.message, rawModelOutput: err.rawModelOutput },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }

  // Find a unique slug scoped to this project. The convention used by the
  // existing components POST endpoint adds a numeric suffix when needed.
  let slug = nameToComponentSlug(componentName);
  if (await getComponentBySlug(orgId, slug, projectId)) {
    let suffix = 2;
    while (await getComponentBySlug(orgId, `${slug}-${suffix}`, projectId)) {
      suffix++;
    }
    slug = `${slug}-${suffix}`;
  }

  let compiledJs: string | undefined;
  try {
    compiledJs = await transpileTsx(result.code);
  } catch {
    // Non-fatal: drawer falls back to raw code view.
  }

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
      { error: "Failed to save generated component" },
      { status: 500 }
    );
  }

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
}
