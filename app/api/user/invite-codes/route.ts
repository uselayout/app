import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserInviteCodes } from "@/lib/supabase/invite-codes";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const codes = await getUserInviteCodes(session.user.id);
    return NextResponse.json({ codes });
  } catch {
    return NextResponse.json({ error: "Failed to load invite codes" }, { status: 500 });
  }
}
