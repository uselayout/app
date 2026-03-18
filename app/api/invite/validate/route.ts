import { NextRequest, NextResponse } from "next/server";
import { validateInviteCode } from "@/lib/supabase/invite-codes";

// GET /api/invite/validate?code=XXXX
// Returns: { valid: boolean, alreadyUsed: boolean, expired: boolean }
// No auth required — public endpoint
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code || code.trim() === "") {
    return NextResponse.json({ valid: false, alreadyUsed: false, expired: false });
  }

  const result = await validateInviteCode(code.trim());
  return NextResponse.json(result);
}
