import { supabase } from "@/lib/supabase/client";
import type {
  AiEndpoint,
  CreditBalance,
  QuotaCheck,
  SubscriptionTier,
} from "@/lib/types/billing";
import { TIER_CREDITS as CREDITS } from "@/lib/types/billing";
import { getUserTier, getSubscriptionByOrg } from "@/lib/billing/subscription";

interface CreditRow {
  id: string;
  user_id: string;
  org_id: string;
  layout_md_remaining: number;
  test_query_remaining: number;
  period_start: string;
  period_end: string;
  topup_layout_md: number;
  topup_test_query: number;
}

function rowToBalance(row: CreditRow): CreditBalance {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    layoutMdRemaining: row.layout_md_remaining,
    testQueryRemaining: row.test_query_remaining,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    topupLayoutMd: row.topup_layout_md,
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

export async function getCreditBalanceByOrg(
  orgId: string
): Promise<CreditBalance | null> {
  const { data, error } = await supabase
    .from("layout_credit_balance")
    .select("*")
    .eq("org_id", orgId)
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
  let balance = await getCreditBalance(userId);
  if (!balance) {
    // Auto-provision starter credits for new users
    const tier = await getUserTier(userId);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await resetMonthlyCredits(userId, tier, 1, now.toISOString(), periodEnd.toISOString());
    balance = await getCreditBalance(userId);
    if (!balance) {
      return { allowed: false, reason: "Failed to provision credits. Please try again." };
    }
  }

  // Auto-reset credits when period has expired (covers free tier + lapsed paid)
  if (new Date(balance.periodEnd) < new Date()) {
    const tier = await getUserTier(userId);
    const now = new Date();
    const newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await resetMonthlyCredits(userId, tier, 1, now.toISOString(), newEnd.toISOString());
    balance = await getCreditBalance(userId);
    if (!balance) {
      return { allowed: false, reason: "Failed to reset credits. Please try again." };
    }
  }

  const creditType = endpoint === "layout-md" ? "layoutMd" : "testQuery";
  const monthly = endpoint === "layout-md"
    ? balance.layoutMdRemaining
    : balance.testQueryRemaining;
  const topup = endpoint === "layout-md"
    ? balance.topupLayoutMd
    : balance.topupTestQuery;

  if (monthly <= 0 && topup <= 0) {
    return {
      allowed: false,
      reason: `No ${creditType === "layoutMd" ? "layout.md" : "test query"} credits remaining. Top up or switch to your own API key.`,
      remaining: {
        layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
        testQuery: balance.testQueryRemaining + balance.topupTestQuery,
      },
    };
  }

  return {
    allowed: true,
    remaining: {
      layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
      testQuery: balance.testQueryRemaining + balance.topupTestQuery,
    },
  };
}

/**
 * Check whether an org has enough credits for an AI call.
 */
export async function checkQuotaByOrg(
  orgId: string,
  endpoint: AiEndpoint
): Promise<QuotaCheck> {
  let balance = await getCreditBalanceByOrg(orgId);
  if (!balance) {
    return { allowed: false, reason: "No credit balance found. Please subscribe to a plan." };
  }

  // Auto-reset credits when period has expired
  if (new Date(balance.periodEnd) < new Date()) {
    const sub = await getSubscriptionByOrg(orgId);
    if (sub && sub.status !== "cancelled") {
      const now = new Date();
      const newEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await resetMonthlyCreditsByOrg(orgId, sub.tier, sub.seatCount, now.toISOString(), newEnd.toISOString());
      balance = await getCreditBalanceByOrg(orgId);
      if (!balance) {
        return { allowed: false, reason: "Failed to reset credits. Please try again." };
      }
    }
  }

  const creditType = endpoint === "layout-md" ? "layoutMd" : "testQuery";
  const monthly = endpoint === "layout-md"
    ? balance.layoutMdRemaining
    : balance.testQueryRemaining;
  const topup = endpoint === "layout-md"
    ? balance.topupLayoutMd
    : balance.topupTestQuery;

  if (monthly <= 0 && topup <= 0) {
    return {
      allowed: false,
      reason: `No ${creditType === "layoutMd" ? "layout.md" : "test query"} credits remaining. Top up or switch to your own API key.`,
      remaining: {
        layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
        testQuery: balance.testQueryRemaining + balance.topupTestQuery,
      },
    };
  }

  return {
    allowed: true,
    remaining: {
      layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
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
  const creditType = endpoint === "layout-md" ? "layout_md" : "test_query";

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
 * Atomically deduct one org credit. Uses a database RPC function to prevent
 * race conditions when concurrent requests both pass the quota check.
 */
export async function deductCreditByOrg(
  orgId: string,
  endpoint: AiEndpoint
): Promise<boolean> {
  const creditType = endpoint === "layout-md" ? "layout_md" : "test_query";

  const { data, error } = await supabase.rpc("layout_deduct_credit_org", {
    p_org_id: orgId,
    p_type: creditType,
  });

  if (error) {
    console.error("Failed to deduct org credit:", error.message);
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
        layout_md_remaining: allocation.layoutMd * multiplier,
        test_query_remaining: allocation.testQuery * multiplier,
        period_start: periodStart,
        period_end: periodEnd,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw new Error(`Failed to reset monthly credits: ${error.message}`);
  }
}

/**
 * Reset monthly credits for an org for a new billing period.
 * Top-up credits are NOT reset — they carry over.
 */
export async function resetMonthlyCreditsByOrg(
  orgId: string,
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
        org_id: orgId,
        layout_md_remaining: allocation.layoutMd * multiplier,
        test_query_remaining: allocation.testQuery * multiplier,
        period_start: periodStart,
        period_end: periodEnd,
      },
      { onConflict: "org_id" }
    );

  if (error) {
    throw new Error(`Failed to reset monthly org credits: ${error.message}`);
  }
}

/** Add top-up credits (these carry over between periods) */
export async function addTopupCredits(userId: string): Promise<void> {
  // First ensure a row exists
  const balance = await getCreditBalance(userId);
  if (!balance) {
    const { error } = await supabase.from("layout_credit_balance").insert({
      user_id: userId,
      layout_md_remaining: 0,
      test_query_remaining: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      topup_layout_md: CREDITS.topup.layoutMd,
      topup_test_query: CREDITS.topup.testQuery,
    });
    if (error) console.error("Failed to create credit balance:", error.message);
    return;
  }

  // Increment top-up credits
  const { error: updateError } = await supabase
    .from("layout_credit_balance")
    .update({
      topup_layout_md: balance.topupLayoutMd + CREDITS.topup.layoutMd,
      topup_test_query: balance.topupTestQuery + CREDITS.topup.testQuery,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Failed to add top-up credits:", updateError.message);
  }
}
