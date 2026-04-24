import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { fetchProjectById } from "@/lib/supabase/db";
import { publishKit } from "@/lib/supabase/kits";
import { buildKitFromProject } from "@/lib/kits/from-project";

const Body = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(80),
  description: z.string().max(400).optional(),
  tags: z.array(z.string().min(1).max(32)).max(12).default([]),
  licence: z.enum(["MIT", "CC-BY-4.0", "custom"]).default("MIT"),
  licenceCustom: z.string().max(2000).optional(),
  tier: z.enum(["minimal", "rich"]).default("minimal"),
  unlisted: z.boolean().default(false),
  previewImageUrl: z.string().url().optional(),
  include: z
    .object({
      components: z.boolean().default(false),
      fonts: z.boolean().default(false),
      branding: z.boolean().default(false),
      context: z.boolean().default(false),
    })
    .default({ components: false, fonts: false, branding: false, context: false }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;
  const { userId, orgId: resolvedOrgId, session } = authResult;

  const parsed = Body.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const input = parsed.data;

  const project = await fetchProjectById(input.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  if (project.orgId !== resolvedOrgId) {
    return NextResponse.json({ error: "Project does not belong to this organisation" }, { status: 403 });
  }

  const user = session?.user;
  const payload = buildKitFromProject({
    project,
    name: input.name,
    description: input.description,
    tags: input.tags,
    licence: input.licence,
    licenceCustom: input.licenceCustom,
    tier: input.tier,
    unlisted: input.unlisted,
    previewImageUrl: input.previewImageUrl ?? project.pendingCanvasImage ?? undefined,
    author: {
      orgId: resolvedOrgId,
      userId,
      displayName: user?.name ?? undefined,
      avatarUrl: (user && "image" in user ? (user.image as string | null | undefined) : undefined) ?? undefined,
    },
    include: input.include,
  });

  const kit = await publishKit(payload);
  return NextResponse.json({
    kitId: kit.id,
    slug: kit.slug,
    url: `/gallery/${kit.slug}`,
  });
}
