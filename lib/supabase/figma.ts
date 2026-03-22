import { supabase } from "./client";
import { encrypt, decrypt, isEncrypted } from "@/lib/util/crypto";

/** Decrypt a token if ENCRYPTION_KEY is available, otherwise return as-is (migration compat). */
function decryptToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;
  if (!isEncrypted(token)) return token; // Plaintext legacy token
  return decrypt(token);
}

/** Encrypt a token if ENCRYPTION_KEY is available, otherwise store plaintext. */
function encryptToken(token: string): string {
  if (!process.env.ENCRYPTION_KEY) return token;
  return encrypt(token);
}

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
    accessToken: decryptToken(row.access_token),
    refreshToken: row.refresh_token ? decryptToken(row.refresh_token) : null,
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
        access_token: encryptToken(accessToken),
        refresh_token: refreshToken ? encryptToken(refreshToken) : null,
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

// ---------------------------------------------------------------------------
// Figma Captures — pending push-to-Figma tree payloads
// ---------------------------------------------------------------------------

export interface FigmaCapture {
  id: string;
  tree: unknown;
  url: string | null;
  title: string | null;
  createdAt: string;
}

interface FigmaCaptureRow {
  id: string;
  org_id: string;
  tree: unknown;
  url: string | null;
  title: string | null;
  consumed: boolean;
  created_at: string;
}

/**
 * Create a pending Figma capture for an org.
 * Upserts — deletes any existing unconsumed captures first so only one
 * pending capture exists per org at a time.
 */
export async function createFigmaCapture(
  orgId: string,
  tree: unknown,
  url: string | null,
  title: string | null,
): Promise<string> {
  // Remove any existing unconsumed captures for this org
  await supabase
    .from("layout_figma_capture")
    .delete()
    .eq("org_id", orgId)
    .eq("consumed", false);

  const { data, error } = await supabase
    .from("layout_figma_capture")
    .insert({
      org_id: orgId,
      tree,
      url,
      title,
      consumed: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create Figma capture: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

/**
 * Get the latest unconsumed capture for an org and mark it as consumed.
 * Returns null if no pending capture exists.
 */
export async function getPendingFigmaCapture(
  orgId: string,
): Promise<FigmaCapture | null> {
  const { data, error } = await supabase
    .from("layout_figma_capture")
    .select("*")
    .eq("org_id", orgId)
    .eq("consumed", false)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const row = data as FigmaCaptureRow;

  // Mark as consumed
  await supabase
    .from("layout_figma_capture")
    .update({ consumed: true })
    .eq("id", row.id);

  return {
    id: row.id,
    tree: row.tree,
    url: row.url,
    title: row.title,
    createdAt: row.created_at,
  };
}
