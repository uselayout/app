import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { bulkCreateTokens, getTokensByOrg } from "@/lib/supabase/tokens";
import { createComponent, getComponentsByOrg } from "@/lib/supabase/components";
import { logAuditEvent } from "@/lib/supabase/audit";
import type { DesignTokenType } from "@/lib/types/token";
import type { ComponentSource } from "@/lib/types/component";

const TokenSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  type: z.enum(["color", "typography", "spacing", "radius", "effect", "motion"]),
  category: z.enum(["primitive", "semantic", "component"]).optional(),
  cssVariable: z.string().optional(),
  description: z.string().optional(),
  groupName: z.string().optional(),
});

const ComponentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["explorer", "extraction", "manual"]).optional(),
});

const PushSchema = z.object({
  tokens: z.array(TokenSchema).optional().default([]),
  components: z.array(ComponentSchema).optional().default([]),
  projectId: z.string().uuid(),
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

  const { tokens, components, projectId, skipDuplicates } = parsed.data;

  const result = {
    tokensCreated: 0,
    tokensSkipped: 0,
    componentsCreated: 0,
    componentsSkipped: 0,
    errors: [] as string[],
  };

  // ── Push tokens ──────────────────────────────────────────────────────────────

  if (tokens.length > 0) {
    let tokensToCreate = tokens;

    if (skipDuplicates) {
      const existing = await getTokensByOrg(orgId);
      const existingSlugs = new Set(existing.map((t) => t.slug));

      tokensToCreate = tokens.filter((t) => {
        const slug = t.name
          .toLowerCase()
          .replace(/[/\s]+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
        if (existingSlugs.has(slug)) {
          result.tokensSkipped++;
          return false;
        }
        return true;
      });
    }

    if (tokensToCreate.length > 0) {
      const created = await bulkCreateTokens(
        orgId,
        tokensToCreate.map((t, i) => ({
          name: t.name,
          type: t.type as DesignTokenType,
          value: t.value,
          category: t.category,
          cssVariable: t.cssVariable,
          description: t.description,
          groupName: t.groupName ?? t.type,
          sortOrder: i,
          source: "extracted" as const,
          projectId,
        }))
      );

      result.tokensCreated = created;

      await logAuditEvent({
        orgId,
        actorId: userId,
        action: "token.imported",
        resourceType: "token",
        resourceId: projectId,
        resourceName: `${created} tokens from studio`,
      });
    }
  }

  // ── Push components ──────────────────────────────────────────────────────────

  if (components.length > 0) {
    let existingNames: Set<string> | undefined;

    if (skipDuplicates) {
      const existing = await getComponentsByOrg(orgId);
      existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
    }

    for (const comp of components) {
      if (existingNames?.has(comp.name.toLowerCase())) {
        result.componentsSkipped++;
        continue;
      }

      const slug = nameToSlug(comp.name);
      const created = await createComponent({
        orgId,
        name: comp.name,
        slug,
        code: comp.code,
        description: comp.description,
        category: comp.category,
        source: (comp.source ?? "explorer") as ComponentSource,
        createdBy: userId,
      });

      if (created) {
        result.componentsCreated++;

        await logAuditEvent({
          orgId,
          actorId: userId,
          action: "component.created",
          resourceType: "component",
          resourceId: created.id,
          resourceName: comp.name,
        });
      } else {
        result.errors.push(`Failed to create component: ${comp.name}`);
      }
    }
  }

  return NextResponse.json(result, { status: 201 });
}
