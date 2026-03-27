import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createInviteCodes } from "@/lib/supabase/invite-codes";

const AssignSchema = z.object({
  userId: z.string().min(1),
  count: z.number().int().min(1).max(50),
  batchName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AssignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const codes = await createInviteCodes(
      parsed.data.userId,
      parsed.data.count,
      parsed.data.batchName
    );
    return NextResponse.json(
      { codes: codes.map((c) => c.code) },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to assign codes" },
      { status: 500 }
    );
  }
}
