import { supabase } from "./client";

export interface FigmaConnection {
  id: string;
  orgId: string;
  figmaUserId: string | null;
  figmaUserName: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
  createdAt: string;
  updatedAt: string;
}

interface FigmaConnectionRow {
  id: string;
  org_id: string;
  figma_user_id: string | null;
  figma_user_name: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  scopes: string[];
  created_at: string;
  updated_at: string;
}

function rowToConnection(row: FigmaConnectionRow): FigmaConnection {
  return {
    id: row.id,
    orgId: row.org_id,
    figmaUserId: row.figma_user_id,
    figmaUserName: row.figma_user_name,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    scopes: row.scopes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getFigmaConnection(
  orgId: string,
): Promise<FigmaConnection | null> {
  const { data, error } = await supabase
    .from("layout_figma_connection")
    .select("*")
    .eq("org_id", orgId)
    .single();

  if (error || !data) return null;
  return rowToConnection(data as FigmaConnectionRow);
}

export async function upsertFigmaConnection(
  orgId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: string | null,
  figmaUserId?: string,
  figmaUserName?: string,
): Promise<FigmaConnection> {
  const { data, error } = await supabase
    .from("layout_figma_connection")
    .upsert(
      {
        org_id: orgId,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        figma_user_id: figmaUserId ?? null,
        figma_user_name: figmaUserName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "org_id" },
    )
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to upsert Figma connection: ${error?.message}`);
  }
  return rowToConnection(data as FigmaConnectionRow);
}

export async function deleteFigmaConnection(orgId: string): Promise<void> {
  await supabase
    .from("layout_figma_connection")
    .delete()
    .eq("org_id", orgId);
}

/**
 * Refresh a Figma OAuth token using the refresh token.
 * Returns the new access token and updates the DB.
 */
export async function refreshFigmaToken(
  orgId: string,
): Promise<string> {
  const conn = await getFigmaConnection(orgId);
  if (!conn?.refreshToken) {
    throw new Error("No Figma refresh token available");
  }

  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FIGMA_CLIENT_ID and FIGMA_CLIENT_SECRET must be set");
  }

  const response = await fetch("https://api.figma.com/v1/oauth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: conn.refreshToken,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Figma token refresh failed: ${response.status} ${text}`);
  }

  const result = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(
    Date.now() + result.expires_in * 1000,
  ).toISOString();

  await upsertFigmaConnection(
    orgId,
    result.access_token,
    conn.refreshToken,
    expiresAt,
    conn.figmaUserId ?? undefined,
    conn.figmaUserName ?? undefined,
  );

  return result.access_token;
}

/**
 * Get a valid Figma access token for an org, refreshing if expired.
 */
export async function getValidFigmaToken(orgId: string): Promise<string> {
  const conn = await getFigmaConnection(orgId);
  if (!conn) {
    throw new Error("Figma not connected for this organisation");
  }

  // If no expiry or not expired, use current token
  if (!conn.expiresAt || new Date(conn.expiresAt) > new Date()) {
    return conn.accessToken;
  }

  // Token expired — refresh it
  return refreshFigmaToken(orgId);
}
