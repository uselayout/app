import { auth } from "@/lib/auth";
import { getUsageHistory, getUsageStats } from "@/lib/billing/usage";
import { getCreditBalance } from "@/lib/billing/credits";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const userId = session.user.id;
  const balance = await getCreditBalance(userId);

  const [history, stats] = await Promise.all([
    getUsageHistory(userId, 30),
    balance
      ? getUsageStats(userId, balance.periodStart, balance.periodEnd)
      : Promise.resolve(null),
  ]);

  return Response.json({ history, stats });
}
