export type SubscriptionTier = "free" | "pro" | "team";
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "trialing";
export type AiMode = "byok" | "hosted";
export type AiEndpoint = "design-md" | "test" | "explore";

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
  designMdRemaining: number;
  testQueryRemaining: number;
  periodStart: string;
  periodEnd: string;
  topupDesignMd: number;
  topupTestQuery: number;
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
  costEstimateGbp: number;
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
  remaining?: { designMd: number; testQuery: number };
}

export interface UsageStats {
  totalDesignMd: number;
  totalTestQueries: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostGbp: number;
  periodStart: string;
  periodEnd: string;
}

/** Monthly credit allocations per tier */
export const TIER_CREDITS = {
  free: { designMd: 0, testQuery: 0 },
  pro: { designMd: 50, testQuery: 100 },
  team: { designMd: 50, testQuery: 100 }, // per seat
  topup: { designMd: 30, testQuery: 80 },
} as const;

/** Claude Sonnet 4.6 pricing per token in GBP */
export const TOKEN_COSTS_GBP = {
  input: 3.0 / 1_000_000,
  output: 15.0 / 1_000_000,
} as const;
