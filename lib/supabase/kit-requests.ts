import { supabase } from "./client";
import type { PublicKit } from "@/lib/types/kit";

export type KitRequestStatus = "pending" | "fulfilled" | "rejected";

export interface KitRequest {
  id: string;
  hostname: string;
  url: string;
  name: string;
  description?: string;
  submittedBy: string;
  status: KitRequestStatus;
  fulfilledKitId?: string;
  upvoteCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KitRequestWithVote extends KitRequest {
  hasUpvoted: boolean;
}

interface KitRequestRow {
  id: string;
  hostname: string;
  url: string;
  name: string;
  description: string | null;
  submitted_by: string;
  status: string;
  fulfilled_kit_id: string | null;
  upvote_count: number;
  created_at: string;
  updated_at: string;
}

function rowToRequest(row: KitRequestRow): KitRequest {
  return {
    id: row.id,
    hostname: row.hostname,
    url: row.url,
    name: row.name,
    description: row.description ?? undefined,
    submittedBy: row.submitted_by,
    status: row.status as KitRequestStatus,
    fulfilledKitId: row.fulfilled_kit_id ?? undefined,
    upvoteCount: row.upvote_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Strip protocol, leading www., lowercase, trim trailing slash + path.
 * Throws on invalid URL.
 */
export function normaliseHostname(input: string): string {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);
  return parsed.hostname.replace(/^www\./i, "").toLowerCase();
}

/**
 * Best-effort fetch of <title> + meta description from a URL. Falls back to
 * the hostname if anything goes wrong (timeout, non-200, parse failure).
 */
export async function fetchTitleFromUrl(
  url: string
): Promise<{ title: string; description?: string }> {
  const hostname = normaliseHostname(url);
  const fallback = { title: hostname };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const withProtocol = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const res = await fetch(withProtocol, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return fallback;

    const reader = res.body?.getReader();
    if (!reader) return fallback;

    const decoder = new TextDecoder();
    let html = "";
    let bytesRead = 0;
    const maxBytes = 64 * 1024;
    while (bytesRead < maxBytes) {
      const { value, done } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    try {
      await reader.cancel();
    } catch {
      // ignore
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch?.[1]?.trim();
    const title = rawTitle ? decodeEntities(rawTitle).slice(0, 200) : hostname;

    const descMatch = html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
    );
    const description = descMatch?.[1]
      ? decodeEntities(descMatch[1].trim()).slice(0, 500)
      : undefined;

    return { title, description };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeout);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ");
}

interface ListOptions {
  status?: KitRequestStatus;
  userId?: string;
  limit?: number;
}

export async function listKitRequests(
  opts: ListOptions = {}
): Promise<KitRequestWithVote[]> {
  const { status = "pending", userId, limit = 50 } = opts;

  const { data, error } = await supabase
    .from("layout_kit_request")
    .select("*")
    .eq("status", status)
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    if (error) console.error("listKitRequests failed:", error.message);
    return [];
  }

  const requests = (data as KitRequestRow[]).map(rowToRequest);

  if (!userId || requests.length === 0) {
    return requests.map((r) => ({ ...r, hasUpvoted: false }));
  }

  const { data: upvotes } = await supabase
    .from("layout_kit_request_upvote")
    .select("request_id")
    .eq("user_id", userId)
    .in(
      "request_id",
      requests.map((r) => r.id)
    );
  const voted = new Set((upvotes ?? []).map((u) => (u as { request_id: string }).request_id));
  return requests.map((r) => ({ ...r, hasUpvoted: voted.has(r.id) }));
}

export async function listAllKitRequests(): Promise<KitRequest[]> {
  const { data, error } = await supabase
    .from("layout_kit_request")
    .select("*")
    .order("status", { ascending: true })
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: false });
  if (error || !data) {
    if (error) console.error("listAllKitRequests failed:", error.message);
    return [];
  }
  return (data as KitRequestRow[]).map(rowToRequest);
}

interface CreateInput {
  url: string;
  userId: string;
}

type CreateResult =
  | { ok: true; request: KitRequest }
  | { ok: false; duplicate: true; existing: KitRequest }
  | { ok: false; duplicate: false; error: string };

export async function createKitRequest(input: CreateInput): Promise<CreateResult> {
  let hostname: string;
  try {
    hostname = normaliseHostname(input.url);
  } catch {
    return { ok: false, duplicate: false, error: "Invalid URL" };
  }

  const { data: existing } = await supabase
    .from("layout_kit_request")
    .select("*")
    .eq("hostname", hostname)
    .maybeSingle();
  if (existing) {
    return { ok: false, duplicate: true, existing: rowToRequest(existing as KitRequestRow) };
  }

  const { title, description } = await fetchTitleFromUrl(input.url);

  const { data, error } = await supabase
    .from("layout_kit_request")
    .insert({
      hostname,
      url: input.url.trim(),
      name: title,
      description: description ?? null,
      submitted_by: input.userId,
    })
    .select("*")
    .single();

  if (error || !data) {
    return {
      ok: false,
      duplicate: false,
      error: error?.message ?? "Insert failed",
    };
  }
  return { ok: true, request: rowToRequest(data as KitRequestRow) };
}

export async function fetchKitRequestById(id: string): Promise<KitRequest | null> {
  const { data, error } = await supabase
    .from("layout_kit_request")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToRequest(data as KitRequestRow);
}

export async function hasRequestUpvoted(
  requestId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("layout_kit_request_upvote")
    .select("request_id")
    .eq("request_id", requestId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function toggleRequestUpvote(
  requestId: string,
  userId: string
): Promise<boolean> {
  const already = await hasRequestUpvoted(requestId, userId);
  if (already) {
    await supabase
      .from("layout_kit_request_upvote")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", userId);
    return false;
  }
  await supabase
    .from("layout_kit_request_upvote")
    .insert({ request_id: requestId, user_id: userId });
  return true;
}

export async function deleteKitRequest(id: string): Promise<boolean> {
  const { error } = await supabase.from("layout_kit_request").delete().eq("id", id);
  if (error) console.error("deleteKitRequest failed:", error.message);
  return !error;
}

export async function updateKitRequest(
  id: string,
  patch: { status?: KitRequestStatus; fulfilledKitId?: string | null }
): Promise<boolean> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.fulfilledKitId !== undefined) update.fulfilled_kit_id = patch.fulfilledKitId;
  const { error } = await supabase.from("layout_kit_request").update(update).eq("id", id);
  if (error) console.error("updateKitRequest failed:", error.message);
  return !error;
}

/**
 * Best-effort auto-link: when a kit ships, derive a search key from its slug
 * (drop trailing -lite/-light/-rich) and mark any pending request whose
 * hostname starts with that key as fulfilled. Idempotent and fail-soft.
 */
export async function linkRequestsForKit(kit: PublicKit): Promise<number> {
  const slugKey = kit.slug
    .replace(/-(lite|light|rich|mini|minimal)$/i, "")
    .toLowerCase();
  if (slugKey.length < 3) return 0;

  const { data, error } = await supabase
    .from("layout_kit_request")
    .select("id, hostname")
    .eq("status", "pending")
    .like("hostname", `${slugKey}%`);

  if (error || !data || data.length === 0) return 0;

  const ids = (data as { id: string; hostname: string }[]).map((r) => r.id);
  const { error: updateError } = await supabase
    .from("layout_kit_request")
    .update({
      status: "fulfilled",
      fulfilled_kit_id: kit.id,
      updated_at: new Date().toISOString(),
    })
    .in("id", ids);

  if (updateError) {
    console.error("linkRequestsForKit failed:", updateError.message);
    return 0;
  }
  return ids.length;
}
