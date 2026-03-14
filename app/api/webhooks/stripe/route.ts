import { getStripe } from "@/lib/billing/stripe";
import { STRIPE_CONFIG, tierFromPriceId } from "@/lib/billing/constants";
import {
  upsertSubscription,
  getSubscriptionByStripeCustomerId,
} from "@/lib/billing/subscription";
import { resetMonthlyCredits, resetMonthlyCreditsByOrg, addTopupCredits } from "@/lib/billing/credits";
import { getPersonalOrg } from "@/lib/supabase/organization";
import type Stripe from "stripe";

// Stripe v20: period dates live on SubscriptionItem, not Subscription
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  periodStart: string;
  periodEnd: string;
} {
  const item = subscription.items.data[0];
  if (item) {
    return {
      periodStart: new Date(item.current_period_start * 1000).toISOString(),
      periodEnd: new Date(item.current_period_end * 1000).toISOString(),
    };
  }
  // Fallback: use created date + 30 days
  const now = new Date();
  return {
    periodStart: now.toISOString(),
    periodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Stripe v20: Invoice.subscription is under parent.subscription_details
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as { subscription_details?: { subscription?: string | Stripe.Subscription } } | null;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === "string" ? sub : sub.id;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook signature verification failed:", msg);
    return Response.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      }
      case "invoice.payment_failed": {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err);
    return Response.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return Response.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (session.mode === "payment" && session.metadata?.type === "topup") {
    await addTopupCredits(userId);
    return;
  }

  if (session.mode === "subscription" && session.subscription) {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    const tier = session.metadata?.tier === "team" ? "team" : "pro";
    const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

    // Resolve orgId from session metadata or fall back to personal org
    let orgId = session.metadata?.orgId;
    if (!orgId) {
      const personalOrg = await getPersonalOrg(userId);
      orgId = personalOrg?.id ?? "";
    }

    await upsertSubscription({
      userId,
      orgId,
      tier,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      seatCount: tier === "team" ? (subscription.items.data[1]?.quantity ?? 1) : 1,
    });

    await resetMonthlyCreditsByOrg(orgId, tier, 1, periodStart, periodEnd);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const existing = await getSubscriptionByStripeCustomerId(customerId);
  if (!existing) return;

  const priceId = subscription.items.data[0]?.price.id ?? "";
  const tier = tierFromPriceId(priceId) ?? existing.tier;
  const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

  await upsertSubscription({
    userId: existing.userId,
    tier,
    stripePriceId: priceId,
    status: subscription.status === "active" ? "active" : "past_due",
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    seatCount: subscription.items.data[1]?.quantity ?? 1,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const existing = await getSubscriptionByStripeCustomerId(customerId);
  if (!existing) return;

  await upsertSubscription({
    userId: existing.userId,
    tier: "free",
    status: "cancelled",
    stripeSubscriptionId: null,
    stripePriceId: null,
    cancelAtPeriodEnd: false,
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const customerId = invoice.customer as string;
  const existing = await getSubscriptionByStripeCustomerId(customerId);
  if (!existing) return;

  if (invoice.billing_reason === "subscription_cycle") {
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { periodStart, periodEnd } = getSubscriptionPeriod(subscription);

    await resetMonthlyCreditsByOrg(
      existing.orgId,
      existing.tier,
      existing.seatCount,
      periodStart,
      periodEnd
    );
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const existing = await getSubscriptionByStripeCustomerId(customerId);
  if (!existing) return;

  await upsertSubscription({
    userId: existing.userId,
    status: "past_due",
  });
}
