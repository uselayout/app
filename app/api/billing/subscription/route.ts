import { auth } from "@/lib/auth";
import { getSubscription } from "@/lib/billing/subscription";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const subscription = await getSubscription(session.user.id);

  return Response.json({
    subscription: subscription ?? {
      tier: "free",
      status: "active",
      seatCount: 1,
      cancelAtPeriodEnd: false,
    },
  });
}
