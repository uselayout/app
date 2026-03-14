import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import {
  getTypeScaleByOrg,
  createTypeScaleEntry,
} from "@/lib/supabase/typography";

const CreateTypeScaleSchema = z.object({
  typefaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  fontSize: z.string().min(1),
  fontWeight: z.string().min(1),
  lineHeight: z.string().min(1),
  letterSpacing: z.string().optional(),
  textTransform: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const entries = await getTypeScaleByOrg(orgId);
  return NextResponse.json(entries);
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

  const parsed = CreateTypeScaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entry = await createTypeScaleEntry({
    orgId,
    typefaceId: parsed.data.typefaceId,
    name: parsed.data.name,
    fontSize: parsed.data.fontSize,
    fontWeight: parsed.data.fontWeight,
    lineHeight: parsed.data.lineHeight,
    letterSpacing: parsed.data.letterSpacing,
    textTransform: parsed.data.textTransform,
    sortOrder: parsed.data.sortOrder,
  });

  if (!entry) {
    return NextResponse.json(
      { error: "Failed to create type scale entry" },
      { status: 500 }
    );
  }

  return NextResponse.json(entry, { status: 201 });
}
