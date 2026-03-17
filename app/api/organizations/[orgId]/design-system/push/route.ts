import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { createComponent, getComponentsByProject } from "@/lib/supabase/components";
import { transpileTsx } from "@/lib/transpile";
import type { ComponentSource } from "@/lib/types/component";

const ComponentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["explorer", "extraction", "manual"]).optional(),
});

const PushSchema = z.object({
  components: z.array(ComponentSchema).optional().default([]),
  projectId: z.string().min(1),
  skipDuplicates: z.boolean().optional().default(true),
});

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const { userId } = authResult;

  const body: unknown = await request.json();
  const parsed = PushSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { components, projectId, skipDuplicates } = parsed.data;

  const result = {
    componentsCreated: 0,
    componentsSkipped: 0,
    errors: [] as string[],
  };

  // ── Push components ──────────────────────────────────────────────────────────

  if (components.length > 0) {
    let existingNames: Set<string> | undefined;

    if (skipDuplicates) {
      const existing = await getComponentsByProject(orgId, projectId);
      existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
    }

    for (const comp of components) {
      if (existingNames?.has(comp.name.toLowerCase())) {
        result.componentsSkipped++;
        continue;
      }

      let compiledJs: string | undefined;
      try {
        compiledJs = transpileTsx(comp.code);
      } catch {
        // Non-fatal: component will show "No preview"
      }

      const slug = nameToSlug(comp.name);
      const created = await createComponent({
        orgId,
        name: comp.name,
        slug,
        code: comp.code,
        compiledJs,
        description: comp.description,
        category: comp.category,
        source: (comp.source ?? "explorer") as ComponentSource,
        createdBy: userId,
        projectId,
      });

      if (created) {
        result.componentsCreated++;
      } else {
        result.errors.push(`Failed to create component: ${comp.name}`);
      }
    }
  }

  return NextResponse.json(result, { status: 201 });
}
