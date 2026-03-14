import { createHash, randomBytes } from "node:crypto";
import { supabase } from "./client";
import type { ApiKey, ApiKeyScope, ApiKeyWithSecret } from "@/lib/types/api-key";

interface ApiKeyRow {
  id: string;
  org_id: string;
  name: string;
  key_hash: string;
  key_preview: string;
  scopes: string[];
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
}

/** Generate a new API key with its hash and preview. */
export function generateApiKey(): { key: string; hash: string; preview: string } {
  const random = randomBytes(20).toString("hex");
  const key = `lyt_${random}`;
  const hash = createHash("sha256").update(key).digest("hex");
  const preview = `lyt_...${random.slice(-4)}`;
  return { key, hash, preview };
}

/** Hash a raw key for lookup. */
function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/** Map a database row to an ApiKey object. */
function rowToApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    keyPreview: row.key_preview,
    scopes: row.scopes as ApiKeyScope[],
    createdBy: row.created_by,
    lastUsedAt: row.last_used_at,
    expiresAt: row.expires_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    createdAt: row.created_at,
  };
}

/** Create an API key — returns the key with secret (only time it's available). */
export async function createApiKey(data: {
  orgId: string;
  name: string;
  scopes?: ApiKeyScope[];
  createdBy: string;
  expiresAt?: string;
}): Promise<ApiKeyWithSecret | null> {
  const { key, hash, preview } = generateApiKey();

  const { data: row, error } = await supabase
    .from("layout_api_key")
    .insert({
      org_id: data.orgId,
      name: data.name,
      key_hash: hash,
      key_preview: preview,
      scopes: data.scopes ?? ["read"],
      created_by: data.createdBy,
      expires_at: data.expiresAt ?? null,
    })
    .select()
    .single<ApiKeyRow>();

  if (error || !row) return null;

  return {
    ...rowToApiKey(row),
    secretKey: key,
  };
}

/** List all non-revoked keys for an organisation. */
export async function getApiKeysByOrg(orgId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from("layout_api_key")
    .select("*")
    .eq("org_id", orgId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .returns<ApiKeyRow[]>();

  if (error || !data) return [];

  return data.map(rowToApiKey);
}

/** Get a key by ID. */
export async function getApiKeyById(id: string): Promise<ApiKey | null> {
  const { data, error } = await supabase
    .from("layout_api_key")
    .select("*")
    .eq("id", id)
    .single<ApiKeyRow>();

  if (error || !data) return null;

  return rowToApiKey(data);
}

/** Validate an API key — hash, lookup, check revoked/expired, update last_used_at. */
export async function validateApiKey(
  rawKey: string
): Promise<{ apiKey: ApiKey; orgId: string } | null> {
  const hash = hashKey(rawKey);

  const { data, error } = await supabase
    .from("layout_api_key")
    .select("*")
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .single<ApiKeyRow>();

  if (error || !data) return null;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Update last_used_at
  await supabase
    .from("layout_api_key")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  const apiKey = rowToApiKey(data);
  return { apiKey, orgId: apiKey.orgId };
}

/** Revoke a key. */
export async function revokeApiKey(id: string, revokedBy: string): Promise<void> {
  await supabase
    .from("layout_api_key")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy,
    })
    .eq("id", id);
}
