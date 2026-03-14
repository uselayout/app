import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { deleteToken, getTokenById, updateToken } from "@/lib/supabase/tokens";
import { logAuditEvent } from "@/lib/supabase/audit";

const UpdateTokenSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().optional(),
  cssVariable: z.string().optional(),
  type: z.enum(["color", "typography", "spacing", "radius", "effect", "motion"]).optional(),
  category: z.enum(["primitive", "semantic", "component"]).optional(),
  value: z.string().min(1).optional(),
  resolvedValue: z.string().optional(),
  groupName: z.string().optional(),
  sortOrder: z.number().int().optional(),
  description: z.string().optional(),
  source: z.enum(["extracted", "manual", "figma-variable"]).optional(),
  projectId: z.string().uuid().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; tokenId: string }> }
) {
  const { orgId, tokenId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const token = await getTokenById(tokenId);
  if (!token || token.orgId !== orgId) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  return NextResponse.json(token);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; tokenId: string }> }
) {
  const { orgId, tokenId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const token = await getTokenById(tokenId);
  if (!token || token.orgId !== orgId) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateToken(tokenId, parsed.data);

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "token.updated",
    resourceType: "token",
    resourceId: tokenId,
    resourceName: token.name,
    details: parsed.data as Record<string, unknown>,
  });

  const updated = await getTokenById(tokenId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; tokenId: string }> }
) {
  const { orgId, tokenId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const token = await getTokenById(tokenId);
  if (!token || token.orgId !== orgId) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  await deleteToken(tokenId);

  void logAuditEvent({
    orgId,
    actorId: authResult.userId,
    actorName: authResult.session?.user?.name ?? undefined,
    action: "token.deleted",
    resourceType: "token",
    resourceId: tokenId,
    resourceName: token.name,
  });

  return NextResponse.json({ success: true });
}
