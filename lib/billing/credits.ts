import { supabase } from "@/lib/supabase/client";
import type {
  AiEndpoint,
  CreditBalance,
  QuotaCheck,
  SubscriptionTier,
} from "@/lib/types/billing";
import { TIER_CREDITS as CREDITS } from "@/lib/types/billing";

interface CreditRow {
  id: string;
  user_id: string;
  design_md_remaining: number;
  test_query_remaining: number;
  period_start: string;
  period_end: string;
  topup_design_md: number;
  topup_test_query: number;
}

function rowToBalance(row: CreditRow): CreditBalance {
  return {
    userId: row.user_id,
    designMdRemaining: row.design_md_remaining,
    testQueryRemaining: row.test_query_remaining,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    topupDesignMd: row.topup_design_md,
    topupTestQuery: row.topup_test_query,
  };
}

export async function getCreditBalance(
  userId: string
): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from("layout_credit_balance")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToBalance(data as CreditRow);
}

/**
 * Check whether a user has enough credits for an AI call.
 * Returns allowed: true if they have remaining monthly OR top-up credits.
 */
export async function checkQuota(
  userId: string,
  endpoint: AiEndpoint
): Promise<QuotaCheck> {
  const balance = await getCreditBalance(userId);
  if (!balance) {
    return { allowed: false, reason: "No credit balance found. Please subscribe to a plan." };
  }

  const creditType = endpoint === "design-md" ? "designMd" : "testQuery";
  const monthly = endpoint === "design-md"
    ? balance.designMdRemaining
    : balance.testQueryRemaining;
  const topup = endpoint === "design-md"
    ? balance.topupDesignMd
    : balance.topupTestQuery;

  if (monthly <= 0 && topup <= 0) {
    return {
      allowed: false,
      reason: `No ${creditType === "designMd" ? "DESIGN.md" : "test query"} credits remaining. Top up or switch to your own API key.`,
      remaining: {
        designMd: balance.designMdRemaining + balance.topupDesignMd,
        testQuery: balance.testQueryRemaining + balance.topupTestQuery,
      },
    };
  }

  return {
    allowed: true,
    remaining: {
      designMd: balance.designMdRemaining + balance.topupDesignMd,
      testQuery: balance.testQueryRemaining + balance.topupTestQuery,
    },
  };
}

/**
 * Atomically deduct one credit. Uses a database RPC function to prevent
 * race conditions when concurrent requests both pass the quota check.
 * Tries monthly credits first, then falls back to top-up credits.
 */
export async function deductCredit(
  userId: string,
  endpoint: AiEndpoint
): Promise<boolean> {
  const creditType = endpoint === "design-md" ? "design_md" : "test_query";

  const { data, error } = await supabase.rpc("layout_deduct_credit", {
    p_user_id: userId,
    p_type: creditType,
  });

  if (error) {
    console.error("Failed to deduct credit:", error.message);
    return false;
  }

  return data === true;
}

/**
 * Reset monthly credits for a new billing period.
 * Top-up credits are NOT reset — they carry over.
 */
export async function resetMonthlyCredits(
  userId: string,
  tier: SubscriptionTier,
  seatCount: number,
  periodStart: string,
  periodEnd: string
): Promise<void> {
  const allocation = CREDITS[tier];
  const multiplier = tier === "team" ? seatCount : 1;

  const { error } = await supabase
    .from("layout_credit_balance")
    .upsert(
      {
        user_id: userId,
        design_md_remaining: allocation.designMd * multiplier,
        test_query_remaining: allocation.testQuery * multiplier,
        period_start: periodStart,
        period_end: periodEnd,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Failed to reset monthly credits:", error.message);
  }
}

/** Add top-up credits (these carry over between periods) */
export async function addTopupCredits(userId: string): Promise<void> {
  // First ensure a row exists
  const balance = await getCreditBalance(userId);
  if (!balance) {
    const { error } = await supabase.from("layout_credit_balance").insert({
      user_id: userId,
      design_md_remaining: 0,
      test_query_remaining: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      topup_design_md: CREDITS.topup.designMd,
      topup_test_query: CREDITS.topup.testQuery,
    });
    if (error) console.error("Failed to create credit balance:", error.message);
    return;
  }

  // Increment top-up credits
  const { error: updateError } = await supabase
    .from("layout_credit_balance")
    .update({
      topup_design_md: balance.topupDesignMd + CREDITS.topup.designMd,
      topup_test_query: balance.topupTestQuery + CREDITS.topup.testQuery,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Failed to add top-up credits:", updateError.message);
  }
}
