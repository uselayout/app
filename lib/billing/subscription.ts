import { supabase } from "@/lib/supabase/client";
import type { Subscription, SubscriptionTier } from "@/lib/types/billing";

interface SubscriptionRow {
  id: string;
  user_id: string;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  seat_count: number;
  created_at: string;
  updated_at: string;
}

function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    tier: row.tier as SubscriptionTier,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    stripePriceId: row.stripe_price_id,
    status: row.status as Subscription["status"],
    currentPeriodStart: row.current_period_start,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: row.cancel_at_period_end,
    seatCount: row.seat_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("sd_aistudio_subscription")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return rowToSubscription(data as SubscriptionRow);
}

export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const sub = await getSubscription(userId);
  if (!sub) return "free";
  if (sub.status === "cancelled") return "free";
  return sub.tier;
}

export async function upsertSubscription(
  sub: Partial<Subscription> & { userId: string }
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: sub.userId,
    updated_at: new Date().toISOString(),
  };

  if (sub.tier !== undefined) row.tier = sub.tier;
  if (sub.stripeCustomerId !== undefined)
    row.stripe_customer_id = sub.stripeCustomerId;
  if (sub.stripeSubscriptionId !== undefined)
    row.stripe_subscription_id = sub.stripeSubscriptionId;
  if (sub.stripePriceId !== undefined) row.stripe_price_id = sub.stripePriceId;
  if (sub.status !== undefined) row.status = sub.status;
  if (sub.currentPeriodStart !== undefined)
    row.current_period_start = sub.currentPeriodStart;
  if (sub.currentPeriodEnd !== undefined)
    row.current_period_end = sub.currentPeriodEnd;
  if (sub.cancelAtPeriodEnd !== undefined)
    row.cancel_at_period_end = sub.cancelAtPeriodEnd;
  if (sub.seatCount !== undefined) row.seat_count = sub.seatCount;

  const { error } = await supabase
    .from("sd_aistudio_subscription")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to upsert subscription:", error.message);
  }
}

export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("sd_aistudio_subscription")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (error || !data) return null;
  return rowToSubscription(data as SubscriptionRow);
}
