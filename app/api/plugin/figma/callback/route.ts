import { NextResponse } from "next/server";
import { upsertFigmaConnection } from "@/lib/supabase/figma";
import { verifyOAuthState } from "@/lib/oauth-state";
import { logEvent } from "@/lib/logging/platform-event";

/**
 * Figma OAuth callback. Figma redirects here after the user authorises.
 * Exchanges the auth code for tokens and stores them.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new NextResponse(renderHtml("Figma Connection Failed", error), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (!code || !stateParam) {
    return new NextResponse(
      renderHtml("Figma Connection Failed", "Missing code or state parameter."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  // Verify HMAC-signed state to prevent orgId tampering
  const state = verifyOAuthState(stateParam);
  if (!state) {
    return new NextResponse(
      renderHtml("Figma Connection Failed", "Invalid or tampered state parameter."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }
  const { orgId } = state;

  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new NextResponse(
      renderHtml("Figma Connection Failed", "Server misconfigured."),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }

  // Use canonical app URL for OAuth redirect to prevent x-forwarded-host manipulation
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const redirectUri = `${origin}/api/plugin/figma/callback`;

  // Exchange code for tokens
  const tokenResponse = await fetch("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    console.error("[Layout] Figma token exchange failed:", text);
    return new NextResponse(
      renderHtml(
        "Figma Connection Failed",
        "Could not exchange authorisation code. Please try again.",
      ),
      { status: 502, headers: { "Content-Type": "text/html" } },
    );
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user_id: string;
  };

  const expiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000,
  ).toISOString();

  // Fetch Figma user info
  let figmaUserName: string | undefined;
  try {
    const meResponse = await fetch("https://api.figma.com/v1/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (meResponse.ok) {
      const me = (await meResponse.json()) as { handle: string };
      figmaUserName = me.handle;
    }
  } catch {
    // Non-critical — continue without username
  }

  await upsertFigmaConnection(
    orgId,
    tokenData.access_token,
    tokenData.refresh_token,
    expiresAt,
    String(tokenData.user_id),
    figmaUserName,
  );

  void logEvent("plugin.figma.connected", "figma-plugin", { orgId, metadata: { figmaUserId: tokenData.user_id, figmaUserName } });

  return new NextResponse(
    renderHtml(
      "Figma Connected",
      `Successfully connected to Figma${figmaUserName ? ` as ${figmaUserName}` : ""}. You can close this tab and return to the Layout extension.`,
      true,
    ),
    { status: 200, headers: { "Content-Type": "text/html" } },
  );
}

function renderHtml(title: string, message: string, success = false): string {
  const colour = success ? "#22c55e" : "#ef4444";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Layout</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0C0C0E; color: #EDEDF4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #141418; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 32px; max-width: 420px; text-align: center; }
    h1 { font-size: 18px; margin: 0 0 12px; color: ${colour}; }
    p { font-size: 14px; color: rgba(237,237,244,0.7); margin: 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}
