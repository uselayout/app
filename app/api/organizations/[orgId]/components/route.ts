import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  createComponent,
  getComponentBySlug,
  getComponentsByOrg,
  getComponentsByProject,
  nameToComponentSlug,
} from "@/lib/supabase/components";
import { logAuditEvent } from "@/lib/supabase/audit";
import { transpileTsx } from "@/lib/transpile";
import type { ComponentStatus } from "@/lib/types/component";

const CreateComponentSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().min(1),
  compiledJs: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(["manual", "explorer", "extraction", "figma", "candidate"]).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ComponentStatus | null;
  const category = url.searchParams.get("category");
  const search = url.searchParams.get("search");
  const projectId = url.searchParams.get("projectId");

  const components = projectId
    ? await getComponentsByProject(orgId, projectId, {
        status: status ?? undefined,
        category: category ?? undefined,
        search: search ?? undefined,
      })
    : await getComponentsByOrg(orgId, {
        status: status ?? undefined,
        category: category ?? undefined,
        search: search ?? undefined,
      });

  return NextResponse.json(components);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "createProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateComponentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let slug = nameToComponentSlug(parsed.data.name);

  // Ensure slug uniqueness
  const existing = await getComponentBySlug(orgId, slug);
  if (existing) {
    let suffix = 2;
    while (await getComponentBySlug(orgId, `${slug}-${suffix}`)) {
      suffix++;
    }
    slug = `${slug}-${suffix}`;
  }

  let compiledJs = parsed.data.compiledJs;
  if (!compiledJs && parsed.data.code) {
    try {
      compiledJs = transpileTsx(parsed.data.code);
    } catch {
      // Non-fatal: component will show "No preview"
    }
  }

  const component = await createComponent({
    orgId,
    name: parsed.data.name,
    slug,
    code: parsed.data.code,
    compiledJs,
    description: parsed.data.description,
    category: parsed.data.category,
    tags: parsed.data.tags,
    source: parsed.data.source,
    createdBy: authResult.userId,
  });

  if (!component) {
    return NextResponse.json(
      { error: "Failed to create component" },
      { status: 500 }
    );
  }

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "component.created",
    resourceType: "component",
    resourceId: component.id,
    resourceName: component.name,
  });

  return NextResponse.json(component, { status: 201 });
}
