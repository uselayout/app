import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { deleteAffiliate, updateAffiliate } from "@/lib/supabase/affiliates";

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().nullable().optional(),
  commissionTier: z.enum(["standard", "flagship"]).optional(),
  payoutEmail: z.string().email().nullable().optional(),
  payoutMethod: z.enum(["wise", "stripe-connect", "paypal", "manual"]).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const affiliate = await updateAffiliate(id, parsed.data);
    return NextResponse.json({ affiliate });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update affiliate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await context.params;

  try {
    await deleteAffiliate(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete affiliate" },
      { status: 500 }
    );
  }
}
