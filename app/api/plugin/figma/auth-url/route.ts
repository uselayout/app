import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import crypto from "crypto";
import { signOAuthState } from "@/lib/oauth-state";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Returns a Figma OAuth URL for the extension to open in a new tab.
 * The user authorises Layout to access their Figma account.
 */
export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) {
    return new NextResponse(auth.body, {
      status: auth.status,
      headers: { ...Object.fromEntries(auth.headers.entries()), ...CORS },
    });
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Figma integration not configured (missing FIGMA_CLIENT_ID)" },
      { status: 501, headers: CORS },
    );
  }

  // Use canonical app URL for OAuth redirect to prevent x-forwarded-host manipulation
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/plugin/figma/callback`;

  // State encodes the orgId so the callback can associate the token.
  // HMAC-signed to prevent tampering (attacker crafting arbitrary orgId).
  const nonce = crypto.randomUUID();
  const state = signOAuthState({ orgId: auth.orgId, nonce });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "file_content:read,file_dev_resources:write",
    state,
    response_type: "code",
  });

  const authUrl = `https://www.figma.com/oauth?${params.toString()}`;

  return NextResponse.json({ authUrl, state }, { headers: CORS });
}
