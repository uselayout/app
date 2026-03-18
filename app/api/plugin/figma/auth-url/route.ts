import { NextResponse } from "next/server";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import crypto from "crypto";

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

  // Behind a reverse proxy, request.url may have an internal origin.
  // Use x-forwarded-host / x-forwarded-proto to build the public URL.
  const headers = new Headers(request.headers);
  const forwardedHost = headers.get("x-forwarded-host");
  const forwardedProto = headers.get("x-forwarded-proto") ?? "https";
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
  const redirectUri = `${origin}/api/plugin/figma/callback`;

  // State encodes the orgId so the callback can associate the token
  const state = Buffer.from(
    JSON.stringify({ orgId: auth.orgId, nonce: crypto.randomUUID() }),
  ).toString("base64url");

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
