import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/billing/stripe";
import { getSubscription, upsertSubscription } from "@/lib/billing/subscription";
import { STRIPE_CONFIG } from "@/lib/billing/constants";

const RequestSchema = z.union([
  z.object({
    tier: z.literal("pro"),
  }),
  z.object({
    tier: z.literal("team"),
    seatCount: z.number().int().min(1).max(100).optional().default(1),
    orgId: z.string().optional(),
  }),
  z.object({ type: z.literal("topup") }),
]);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  const userId = session.user.id;
  const userEmail = session.user.email;

  // Get or create Stripe customer
  const existing = await getSubscription(userId);
  let customerId = existing?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { userId },
    });
    customerId = customer.id;

    // Store the customer ID
    await upsertSubscription({
      userId,
      stripeCustomerId: customerId,
      tier: "free",
      status: "active",
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const data = parsed.data;

  if ("type" in data && data.type === "topup") {
    // One-time credit top-up
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: STRIPE_CONFIG.prices.topup, quantity: 1 }],
      success_url: `${baseUrl}/pricing?success=topup`,
      cancel_url: `${baseUrl}/pricing?cancelled=true`,
      metadata: { userId, type: "topup" },
    });

    return Response.json({ url: checkoutSession.url });
  }

  // Subscription checkout
  const tier = "tier" in data ? data.tier : "pro";
  const priceId = tier === "pro"
    ? STRIPE_CONFIG.prices.pro
    : STRIPE_CONFIG.prices.teamBase;

  const lineItems: { price: string; quantity: number }[] = [
    { price: priceId, quantity: 1 },
  ];

  // Team tier: add a seat line item with requested seat count
  if (tier === "team" && STRIPE_CONFIG.prices.teamSeat) {
    const seatCount = "seatCount" in data ? data.seatCount : 1;
    lineItems.push({ price: STRIPE_CONFIG.prices.teamSeat, quantity: seatCount });
  }

  const metadata: Record<string, string> = { userId, tier };
  if ("orgId" in data && data.orgId) {
    metadata.orgId = data.orgId;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    success_url: `${baseUrl}/pricing?success=${tier}`,
    cancel_url: `${baseUrl}/pricing?cancelled=true`,
    metadata,
  });

  return Response.json({ url: checkoutSession.url });
}
