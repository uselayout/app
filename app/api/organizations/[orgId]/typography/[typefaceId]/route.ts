import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getTypefaceById,
  updateTypeface,
  deleteTypeface,
} from "@/lib/supabase/typography";

const UpdateTypefaceSchema = z.object({
  family: z.string().min(1).max(200).optional(),
  source: z.enum(["google", "custom", "system", "extracted"]).optional(),
  googleFontsUrl: z.string().url().optional().nullable(),
  weights: z.array(z.string()).optional(),
  role: z
    .enum(["heading", "body", "mono", "display", "accent"])
    .optional()
    .nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; typefaceId: string }> }
) {
  const { orgId, typefaceId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const typeface = await getTypefaceById(typefaceId);
  if (!typeface || typeface.orgId !== orgId) {
    return NextResponse.json(
      { error: "Typeface not found" },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateTypefaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await updateTypeface(typefaceId, parsed.data);

  const updated = await getTypefaceById(typefaceId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ orgId: string; typefaceId: string }> }
) {
  const { orgId, typefaceId } = await params;

  const authResult = await requireOrgAuth(orgId, "editProject");
  if (authResult instanceof NextResponse) return authResult;

  const typeface = await getTypefaceById(typefaceId);
  if (!typeface || typeface.orgId !== orgId) {
    return NextResponse.json(
      { error: "Typeface not found" },
      { status: 404 }
    );
  }

  await deleteTypeface(typefaceId);
  return NextResponse.json({ success: true });
}
