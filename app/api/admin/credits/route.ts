import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { requireAdmin } from "@/lib/api/admin-context";
import { supabase } from "@/lib/supabase/client";
import { getCreditBalance } from "@/lib/billing/credits";

const TopUpSchema = z.object({
  email: z.string().email(),
  layoutMd: z.number().int().min(0).max(100).default(0),
  aiQuery: z.number().int().min(0).max(100).default(0),
});

/** GET: Look up a user's credit balance by email */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "email parameter is required" }, { status: 400 });
  }

  // Look up user
  const { data: user, error: userError } = await supabase
    .from("layout_user")
    .select("id, email, name")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: `Lookup failed: ${userError.message}` }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balance = await getCreditBalance(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    balance: balance
      ? {
          layoutMdRemaining: balance.layoutMdRemaining,
          aiQueryRemaining: balance.aiQueryRemaining,
          topupLayoutMd: balance.topupLayoutMd,
          topupAiQuery: balance.topupAiQuery,
          periodStart: balance.periodStart,
          periodEnd: balance.periodEnd,
        }
      : null,
  });
}

/** POST: Add credits to a user's balance */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = TopUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, layoutMd, aiQuery } = parsed.data;

  if (layoutMd === 0 && aiQuery === 0) {
    return NextResponse.json({ error: "Must add at least 1 credit" }, { status: 400 });
  }

  // Look up user
  const { data: user, error: userError } = await supabase
    .from("layout_user")
    .select("id, email, name")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (userError) {
    return NextResponse.json({ error: `Lookup failed: ${userError.message}` }, { status: 500 });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const balance = await getCreditBalance(user.id);

  if (!balance) {
    // Create a balance row with the top-up credits
    const { error: insertError } = await supabase.from("layout_credit_balance").insert({
      user_id: user.id,
      design_md_remaining: 0,
      test_query_remaining: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      topup_design_md: layoutMd,
      topup_test_query: aiQuery,
    });

    if (insertError) {
      return NextResponse.json({ error: `Failed to create balance: ${insertError.message}` }, { status: 500 });
    }
  } else {
    // Increment existing top-up credits
    const { error: updateError } = await supabase
      .from("layout_credit_balance")
      .update({
        topup_design_md: balance.topupLayoutMd + layoutMd,
        topup_test_query: balance.topupAiQuery + aiQuery,
      })
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update credits: ${updateError.message}` }, { status: 500 });
    }
  }

  const updated = await getCreditBalance(user.id);

  return NextResponse.json({
    message: `Added ${layoutMd} layout.md and ${aiQuery} AI query credits to ${user.email}`,
    balance: updated
      ? {
          layoutMdRemaining: updated.layoutMdRemaining,
          aiQueryRemaining: updated.aiQueryRemaining,
          topupLayoutMd: updated.topupLayoutMd,
          topupAiQuery: updated.topupAiQuery,
        }
      : null,
  });
}
