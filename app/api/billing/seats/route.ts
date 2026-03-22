import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { auth } from "@/lib/auth";
import { requireOrgAuth } from "@/lib/api/auth-context";
import { getStripe } from "@/lib/billing/stripe";
import { STRIPE_CONFIG } from "@/lib/billing/constants";
import { getSubscription } from "@/lib/billing/subscription";
import { getOrgMemberCount, getPendingInviteCount } from "@/lib/supabase/organization";

const RequestSchema = z.object({
  seatCount: z.number().int().min(1).max(100),
});

export async function POST(request: Request) {
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

  const { seatCount } = parsed.data;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;
  const subscription = await getSubscription(userId);
  if (!subscription?.stripeSubscriptionId) {
    return Response.json(
      { error: "No active subscription found" },
      { status: 400 }
    );
  }

  // Verify user has manageBilling permission on the subscription's org
  const orgAuth = await requireOrgAuth(subscription.orgId, "manageBilling");
  if (orgAuth instanceof NextResponse) return orgAuth;

  if (subscription.tier !== "team") {
    return Response.json(
      { error: "Seat management is only available on the Team plan" },
      { status: 400 }
    );
  }

  // Ensure seat count isn't below current members + pending invites
  const memberCount = await getOrgMemberCount(subscription.orgId);
  const pendingInvites = await getPendingInviteCount(subscription.orgId);
  const minimumSeats = memberCount + pendingInvites;

  if (seatCount < minimumSeats) {
    return Response.json(
      {
        error: `Cannot reduce below ${minimumSeats} seats (${memberCount} members + ${pendingInvites} pending invites)`,
      },
      { status: 400 }
    );
  }

  // Find the seat line item in the Stripe subscription
  const stripe = getStripe();
  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId
  );

  const seatItem = stripeSubscription.items.data.find(
    (item) => item.price.id === STRIPE_CONFIG.prices.teamSeat
  );

  if (!seatItem) {
    return Response.json(
      { error: "Seat line item not found on subscription" },
      { status: 500 }
    );
  }

  // Update the seat quantity — Stripe handles proration automatically
  await stripe.subscriptionItems.update(seatItem.id, {
    quantity: seatCount,
  });

  return Response.json({ seatCount });
}
