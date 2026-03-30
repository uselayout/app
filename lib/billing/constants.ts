import "server-only";

/** Stripe price IDs — set in environment variables */
export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  prices: {
    pro: process.env.STRIPE_PRO_PRICE_ID ?? "",
    teamBase: process.env.STRIPE_TEAM_BASE_PRICE_ID ?? "",
    teamSeat: process.env.STRIPE_TEAM_SEAT_PRICE_ID ?? "",
    topup: process.env.STRIPE_TOPUP_PRICE_ID ?? "",
  },
} as const;

/** Map Stripe price IDs back to tiers */
export function tierFromPriceId(priceId: string): "pro" | "team" | null {
  if (priceId === STRIPE_CONFIG.prices.pro) return "pro";
  if (
    priceId === STRIPE_CONFIG.prices.teamBase ||
    priceId === STRIPE_CONFIG.prices.teamSeat
  )
    return "team";
  return null;
}
