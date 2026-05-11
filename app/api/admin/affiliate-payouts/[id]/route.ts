import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { markPayoutPaid } from "@/lib/supabase/affiliates";

const PatchSchema = z.object({
  paidAt: z.string().datetime(),
  payoutMethod: z.enum(["wise", "stripe-connect", "paypal", "manual"]).nullable().optional(),
  payoutReference: z.string().max(200).nullable().optional(),
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
    const payout = await markPayoutPaid(id, parsed.data);
    return NextResponse.json({ payout });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark payout paid" },
      { status: 500 }
    );
  }
}
