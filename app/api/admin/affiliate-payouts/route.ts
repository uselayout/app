import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createPayout, listPayouts } from "@/lib/supabase/affiliates";

const CreateSchema = z.object({
  affiliateId: z.string().uuid(),
  payoutMethod: z.enum(["wise", "stripe-connect", "paypal", "manual"]).nullable().optional(),
  payoutReference: z.string().max(200).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const payouts = await listPayouts();
    return NextResponse.json({ payouts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list payouts" },
      { status: 500 }
    );
  }
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

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const payout = await createPayout(parsed.data);
    return NextResponse.json({ payout }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create payout" },
      { status: 500 }
    );
  }
}
