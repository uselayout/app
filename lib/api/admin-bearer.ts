import "server-only";
import { supabase } from "@/lib/supabase/client";

export interface BearerAdminUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

/**
 * Resolve the admin user identified by `Authorization: Bearer <ADMIN_API_KEY>`.
 * Used by server-to-server callers (batch scripts, internal tooling) that
 * cannot juggle Better Auth cookie sessions. The bearer token authenticates
 * as the first email listed in `ADMIN_EMAIL` — that user must already exist
 * in `layout_user`.
 *
 * Returns null when:
 *   - `ADMIN_API_KEY` env var is unset
 *   - request has no `Authorization: Bearer ...` header
 *   - bearer token doesn't match the configured key
 *   - `ADMIN_EMAIL` is unset, or the email isn't a registered user
 */
export async function resolveBearerAdmin(
  requestHeaders: Headers
): Promise<BearerAdminUser | null> {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) return null;

  const authHeader = requestHeaders.get("authorization");
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token || token !== expected) return null;

  const adminEmails = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) return null;

  // Always resolve to the FIRST email in the list. Using `.in()` against a
  // multi-email ADMIN_EMAIL was non-deterministic — Postgres without an
  // ORDER BY can return either match, so callers couldn't predict which
  // org the bearer would land in. First-wins is documented and stable.
  const primaryEmail = adminEmails[0];
  const { data, error } = await supabase
    .from("layout_user")
    .select("id, email, name, image")
    .eq("email", primaryEmail)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id as string,
    email: data.email as string,
    name: (data.name as string | null) ?? null,
    image: (data.image as string | null) ?? null,
  };
}
