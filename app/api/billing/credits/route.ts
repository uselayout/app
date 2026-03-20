import { auth } from "@/lib/auth";
import { getCreditBalance } from "@/lib/billing/credits";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }

  const balance = await getCreditBalance(session.user.id);

  return Response.json({
    credits: balance ?? {
      layoutMdRemaining: 0,
      testQueryRemaining: 0,
      topupLayoutMd: 0,
      topupTestQuery: 0,
      periodStart: null,
      periodEnd: null,
    },
  });
}
