import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { createToken, getTokensByOrg } from "@/lib/supabase/tokens";
import type { DesignTokenCategory, DesignTokenType } from "@/lib/types/token";

const CreateTokenSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["color", "typography", "spacing", "radius", "effect", "motion"]),
  value: z.string().min(1),
  category: z.enum(["primitive", "semantic", "component"]).optional(),
  cssVariable: z.string().optional(),
  groupName: z.string().optional(),
  description: z.string().optional(),
  source: z.enum(["extracted", "manual", "figma-variable"]).optional(),
  projectId: z.string().uuid().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") as DesignTokenType | null;
  const category = url.searchParams.get("category") as DesignTokenCategory | null;
  const group = url.searchParams.get("group");
  const search = url.searchParams.get("search");

  const tokens = await getTokensByOrg(orgId, {
    type: type ?? undefined,
    category: category ?? undefined,
    groupName: group ?? undefined,
    search: search ?? undefined,
  });

  return NextResponse.json(tokens);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token = await createToken({
    orgId,
    name: parsed.data.name,
    type: parsed.data.type,
    value: parsed.data.value,
    category: parsed.data.category,
    cssVariable: parsed.data.cssVariable,
    groupName: parsed.data.groupName,
    description: parsed.data.description,
    source: parsed.data.source,
    projectId: parsed.data.projectId,
  });

  if (!token) {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }

  return NextResponse.json(token, { status: 201 });
}
