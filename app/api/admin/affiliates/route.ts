import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/admin-context";
import { createAffiliate, listAffiliatesWithStats } from "@/lib/supabase/affiliates";

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().nullable().optional(),
  commissionTier: z.enum(["standard", "flagship"]),
  payoutEmail: z.string().email().nullable().optional(),
  payoutMethod: z.enum(["wise", "stripe-connect", "paypal", "manual"]).nullable().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const affiliates = await listAffiliatesWithStats();
    return NextResponse.json({ affiliates });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list affiliates" },
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
    const affiliate = await createAffiliate(parsed.data);
    return NextResponse.json({ affiliate }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create affiliate" },
      { status: 500 }
    );
  }
}
