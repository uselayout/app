import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getTypeScaleEntryById,
  updateTypeScaleEntry,
  deleteTypeScaleEntry,
} from "@/lib/supabase/typography";

const UpdateTypeScaleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fontSize: z.string().min(1).optional(),
  fontWeight: z.string().min(1).optional(),
  lineHeight: z.string().min(1).optional(),
  letterSpacing: z.string().optional(),
  textTransform: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; scaleId: string }> }
) {
  const { orgId, scaleId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const entry = await getTypeScaleEntryById(scaleId);
  if (!entry || entry.orgId !== orgId) {
    return NextResponse.json(
      { error: "Type scale entry not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTypeScaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateTypeScaleEntry(scaleId, parsed.data);

  const updated = await getTypeScaleEntryById(scaleId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; scaleId: string }> }
) {
  const { orgId, scaleId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const entry = await getTypeScaleEntryById(scaleId);
  if (!entry || entry.orgId !== orgId) {
    return NextResponse.json(
      { error: "Type scale entry not found" },
      { status: 404 }
    );
  }

  await deleteTypeScaleEntry(scaleId);
  return NextResponse.json({ success: true });
}
