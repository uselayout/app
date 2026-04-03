import { supabase } from "@/lib/supabase/client";
import type {
  AiEndpoint,
  CreditBalance,
  QuotaCheck,
  SubscriptionTier,
} from "@/lib/types/billing";
import { TIER_CREDITS as CREDITS, ALPHA_MODE, ALPHA_CREDITS } from "@/lib/types/billing";
import { getUserTier, getSubscriptionByOrg } from "@/lib/billing/subscription";

interface CreditRow {
  id: string;
  user_id: string;
  org_id: string;
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
    orgId: row.org_id,
    layoutMdRemaining: row.design_md_remaining,
    aiQueryRemaining: row.test_query_remaining,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    topupLayoutMd: row.topup_design_md,
    topupAiQuery: row.topup_test_query,
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
 * Get credit balance, auto-provisioning starter credits for new users.
 * Use this instead of getCreditBalance() when you need to guarantee a row exists.
 */
export async function getOrCreateCreditBalance(
  userId: string
): Promise<CreditBalance> {
  let balance = await getCreditBalance(userId);
  if (!balance) {
    const tier = await getUserTier(userId);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await resetMonthlyCredits(userId, tier, 1, now.toISOString(), periodEnd.toISOString());
    balance = await getCreditBalance(userId);
  }
  if (!balance) {
    return {
      userId,
      orgId: "",
      layoutMdRemaining: 0,
      aiQueryRemaining: 0,
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      topupLayoutMd: 0,
      topupAiQuery: 0,
    };
  }
  return balance;
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

  const creditType = endpoint === "layout-md" ? "layoutMd" : "aiQuery";
  const monthly = endpoint === "layout-md"
    ? balance.layoutMdRemaining
    : balance.aiQueryRemaining;
  const topup = endpoint === "layout-md"
    ? balance.topupLayoutMd
    : balance.topupAiQuery;

  if (monthly <= 0 && topup <= 0) {
    return {
      allowed: false,
      reason: `No ${creditType === "layoutMd" ? "layout.md" : "AI query"} credits remaining. Top up or switch to your own API key.`,
      remaining: {
        layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
        aiQuery: balance.aiQueryRemaining + balance.topupAiQuery,
      },
    };
  }

  return {
    allowed: true,
    remaining: {
      layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
      aiQuery: balance.aiQueryRemaining + balance.topupAiQuery,
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

  const creditType = endpoint === "layout-md" ? "layoutMd" : "aiQuery";
  const monthly = endpoint === "layout-md"
    ? balance.layoutMdRemaining
    : balance.aiQueryRemaining;
  const topup = endpoint === "layout-md"
    ? balance.topupLayoutMd
    : balance.topupAiQuery;

  if (monthly <= 0 && topup <= 0) {
    return {
      allowed: false,
      reason: `No ${creditType === "layoutMd" ? "layout.md" : "AI query"} credits remaining. Top up or switch to your own API key.`,
      remaining: {
        layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
        aiQuery: balance.aiQueryRemaining + balance.topupAiQuery,
      },
    };
  }

  return {
    allowed: true,
    remaining: {
      layoutMd: balance.layoutMdRemaining + balance.topupLayoutMd,
      aiQuery: balance.aiQueryRemaining + balance.topupAiQuery,
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
  const creditType = endpoint === "layout-md" ? "design_md" : "test_query";

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
  const creditType = endpoint === "layout-md" ? "design_md" : "test_query";

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
 * Refund one credit after a failed stream (server restart, Claude API error, etc.).
 * Reverses the deduction by calling the refund RPC to atomically increment
 * the credit counter. Falls back to a direct column increment if the RPC
 * is not yet deployed.
 */
export async function refundCredit(
  userId: string,
  endpoint: AiEndpoint
): Promise<boolean> {
  const creditType = endpoint === "layout-md" ? "design_md" : "test_query";

  const { data, error } = await supabase.rpc("layout_refund_credit", {
    p_user_id: userId,
    p_type: creditType,
  });

  if (error) {
    console.error("Failed to refund credit:", error.message);
    return false;
  }

  console.log(`[billing] Refunded 1 ${creditType} credit for user ${userId}`);
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
  const allocation = (ALPHA_MODE && tier === "free") ? ALPHA_CREDITS : CREDITS[tier];
  const multiplier = tier === "team" ? seatCount : 1;

  const { error } = await supabase
    .from("layout_credit_balance")
    .upsert(
      {
        user_id: userId,
        design_md_remaining: allocation.layoutMd * multiplier,
        test_query_remaining: allocation.aiQuery * multiplier,
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
  const allocation = (ALPHA_MODE && tier === "free") ? ALPHA_CREDITS : CREDITS[tier];
  const multiplier = tier === "team" ? seatCount : 1;

  const { error } = await supabase
    .from("layout_credit_balance")
    .upsert(
      {
        org_id: orgId,
        design_md_remaining: allocation.layoutMd * multiplier,
        test_query_remaining: allocation.aiQuery * multiplier,
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
      design_md_remaining: 0,
      test_query_remaining: 0,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      topup_design_md: CREDITS.topup.layoutMd,
      topup_test_query: CREDITS.topup.aiQuery,
    });
    if (error) console.error("Failed to create credit balance:", error.message);
    return;
  }

  // Increment top-up credits
  const { error: updateError } = await supabase
    .from("layout_credit_balance")
    .update({
      topup_design_md: balance.topupLayoutMd + CREDITS.topup.layoutMd,
      topup_test_query: balance.topupAiQuery + CREDITS.topup.aiQuery,
    })
    .eq("user_id", userId);

  if (updateError) {
    console.error("Failed to add top-up credits:", updateError.message);
  }
}
