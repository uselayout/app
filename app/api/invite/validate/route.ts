import { NextRequest, NextResponse } from "next/server";
import { validateInviteCode } from "@/lib/supabase/invite-codes";
import { inviteValidateLimiter } from "@/lib/rate-limit-instances";
import { getClientIp } from "@/lib/get-client-ip";

// GET /api/invite/validate?code=XXXX
// Returns: { valid: boolean, alreadyUsed: boolean, expired: boolean }
// Public endpoint — rate-limited by IP to prevent brute-force enumeration
export async function GET(request: NextRequest) {
  const ip = await getClientIp();
  const { success } = inviteValidateLimiter.check(10, ip);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const code = request.nextUrl.searchParams.get("code");

  if (!code || code.trim() === "") {
    return NextResponse.json({ valid: false, alreadyUsed: false, expired: false });
  }

  const result = await validateInviteCode(code.trim());
  return NextResponse.json(result);
}
