import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getTypefacesByOrg, createTypeface } from "@/lib/supabase/typography";
import type { TypefaceRole, TypefaceSource } from "@/lib/types/typography";

const CreateTypefaceSchema = z.object({
  family: z.string().min(1).max(200),
  source: z.enum(["google", "custom", "system", "extracted"]).optional(),
  googleFontsUrl: z.string().url().optional(),
  weights: z.array(z.string()).optional(),
  role: z.enum(["heading", "body", "mono", "display", "accent"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;

  const authResult = await requireOrgAuth(orgId, "viewProject");
  if (authResult instanceof NextResponse) return authResult;

  const typefaces = await getTypefacesByOrg(orgId);
  return NextResponse.json(typefaces);
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

  const parsed = CreateTypefaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const typeface = await createTypeface({
    orgId,
    family: parsed.data.family,
    source: parsed.data.source as TypefaceSource | undefined,
    googleFontsUrl: parsed.data.googleFontsUrl,
    weights: parsed.data.weights,
    role: parsed.data.role as TypefaceRole | undefined,
  });

  if (!typeface) {
    return NextResponse.json(
      { error: "Failed to create typeface" },
      { status: 500 }
    );
  }

  return NextResponse.json(typeface, { status: 201 });
}
