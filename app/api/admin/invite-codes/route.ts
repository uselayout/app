import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createInviteCodes } from "@/lib/supabase/invite-codes";
import { supabase } from "@/lib/supabase/client";

const GenerateSchema = z.object({
  count: z.number().int().min(1).max(100),
  batchName: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const batchName = url.searchParams.get("batchName");

  let query = supabase
    .from("invite_codes")
    .select(
      `
      code,
      created_by,
      batch_name,
      redeemed_by,
      redeemed_at,
      expires_at,
      created_at,
      redeemed_user:layout_user!invite_codes_redeemed_by_fkey(email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (batchName) {
    query = query.eq("batch_name", batchName);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch invite codes: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const codes = await createInviteCodes(
      auth.userId,
      parsed.data.count,
      parsed.data.batchName
    );
    return NextResponse.json({ codes: codes.map((c) => c.code) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create codes" },
      { status: 500 }
    );
  }
}
