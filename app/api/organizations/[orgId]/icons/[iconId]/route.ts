import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  deleteIcon,
  getIconById,
  updateIcon,
} from "@/lib/supabase/icons";

const UpdateIconSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  svg: z.string().optional(),
  viewbox: z.string().optional(),
  sizes: z.array(z.number()).optional(),
  strokeWidth: z.number().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; iconId: string }> }
) {
  const { orgId, iconId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const icon = await getIconById(iconId);
  if (!icon || icon.orgId !== orgId) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });
  }

  return NextResponse.json(icon);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; iconId: string }> }
) {
  const { orgId, iconId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const icon = await getIconById(iconId);
  if (!icon || icon.orgId !== orgId) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateIconSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateIcon(iconId, parsed.data);

  const updated = await getIconById(iconId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; iconId: string }> }
) {
  const { orgId, iconId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const icon = await getIconById(iconId);
  if (!icon || icon.orgId !== orgId) {
    return NextResponse.json({ error: "Icon not found" }, { status: 404 });
  }

  await deleteIcon(iconId);
  return NextResponse.json({ success: true });
}
