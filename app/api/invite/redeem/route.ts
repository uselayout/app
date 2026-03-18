import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { redeemInviteCode, createInviteCodes } from "@/lib/supabase/invite-codes";
import { auth } from "@/lib/auth";

// POST /api/invite/redeem
// Body: { code: string }
// Requires authentication — userId is taken from the session, not the request body
const schema = z.object({
  code: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { code } = parsed.data;
  const userId = session.user.id;

  try {
    await redeemInviteCode(code, userId);
    await createInviteCodes(userId, 3);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to redeem invite code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
