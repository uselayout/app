export type SubscriptionTier = "free" | "pro" | "team";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";
export type AiMode = "byok" | "hosted";
export type AiEndpoint = "layout-md" | "test" | "explore" | "edit";

export interface Subscription {
  id: string;
  userId: string;
  orgId: string;
  tier: SubscriptionTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  seatCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreditBalance {
  userId: string;
  orgId: string;
  layoutMdRemaining: number;
  aiQueryRemaining: number;
  periodStart: string;
  periodEnd: string;
  topupLayoutMd: number;
  topupAiQuery: number;
}

export interface UsageLogEntry {
  id: string;
  userId: string;
  projectId: string | null;
  endpoint: AiEndpoint;
  mode: AiMode;
  inputTokens: number;
  outputTokens: number;
  model: string;
  costEstimateUsd: number;
  createdAt: string;
}

export interface TokenUsageResult {
  inputTokens: number;
  outputTokens: number;
}

export interface StreamWithUsage {
  stream: ReadableStream<Uint8Array>;
  usage: Promise<TokenUsageResult>;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
  remaining?: { layoutMd: number; aiQuery: number };
}

export interface UsageStats {
  totalLayoutMd: number;
  totalAiQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  periodStart: string;
  periodEnd: string;
}

/** Monthly credit allocations per tier */
export const TIER_CREDITS = {
  free: { layoutMd: 2, aiQuery: 5 },
  pro: { layoutMd: 50, aiQuery: 100 },
  team: { layoutMd: 50, aiQuery: 100 }, // per seat
  topup: { layoutMd: 30, aiQuery: 80 },
} as const;

/** Alpha phase: generous credits for early testers. Set to false to revert to standard free tier. */
export const ALPHA_MODE = true;
export const ALPHA_CREDITS = { layoutMd: 5, aiQuery: 100 } as const;

/** Claude Sonnet 4.6 pricing per token in USD */
export const TOKEN_COSTS_USD = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
} as const;
