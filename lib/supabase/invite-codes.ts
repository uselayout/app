/*
 * Invite Codes — Supabase CRUD
 *
 * ─── DB Schema (run manually in Supabase dashboard) ──────────────────────────
 *
 * CREATE TABLE invite_codes (
 *   code           TEXT PRIMARY KEY,                          -- 8-char alphanumeric
 *   created_by     UUID REFERENCES layout_user(id),           -- NULL for admin-generated
 *   batch_name     TEXT,                                      -- e.g. "@uiinfluencer" for influencer batches, NULL for user referral codes
 *   redeemed_by    UUID REFERENCES layout_user(id),
 *   redeemed_at    TIMESTAMP WITH TIME ZONE,
 *   expires_at     TIMESTAMP WITH TIME ZONE,                  -- NULL = no expiry
 *   created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
 * );
 *
 * CREATE TABLE affiliates (
 *   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name           TEXT NOT NULL,                             -- "@uiinfluencer"
 *   email          TEXT,
 *   commission_pct INT DEFAULT 20,
 *   created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
 * );
 *
 * CREATE TABLE access_requests (
 *   id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name           TEXT NOT NULL,
 *   email          TEXT NOT NULL,
 *   what_building  TEXT NOT NULL,
 *   how_heard      TEXT NOT NULL,
 *   status         TEXT DEFAULT 'pending',                    -- 'pending' | 'approved' | 'rejected'
 *   invite_code    TEXT REFERENCES invite_codes(code),
 *   created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
 * );
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InviteCode {
  code: string;
  createdBy: string | null;
  batchName: string | null;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface AccessRequest {
  id: string;
  name: string;
  email: string;
  whatBuilding: string;
  howHeard: string;
  status: "pending" | "approved" | "rejected";
  inviteCode: string | null;
  createdAt: string;
}

// ─── Row Types ────────────────────────────────────────────────────────────────

interface InviteCodeRow {
  code: string;
  created_by: string | null;
  batch_name: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface AccessRequestRow {
  id: string;
  name: string;
  email: string;
  what_building: string;
  how_heard: string;
  status: string;
  invite_code: string | null;
  created_at: string;
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToInviteCode(row: InviteCodeRow): InviteCode {
  return {
    code: row.code,
    createdBy: row.created_by,
    batchName: row.batch_name,
    redeemedBy: row.redeemed_by,
    redeemedAt: row.redeemed_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function rowToAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    whatBuilding: row.what_building,
    howHeard: row.how_heard,
    status: row.status as AccessRequest["status"],
    inviteCode: row.invite_code,
    createdAt: row.created_at,
  };
}

// ─── Code Generation ──────────────────────────────────────────────────────────

/** Generates an 8-character lowercase alphanumeric code. */
export function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 8 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ─── Invite Code CRUD ─────────────────────────────────────────────────────────

/**
 * Creates N invite codes in the DB and returns them.
 * @param createdBy — user ID of the creator, or null for admin-generated codes
 * @param count     — number of codes to generate
 * @param batchName — optional label (e.g. "@uiinfluencer")
 */
export async function createInviteCodes(
  createdBy: string | null,
  count: number,
  batchName?: string
): Promise<InviteCode[]> {
  const now = new Date().toISOString();

  const rows: InviteCodeRow[] = Array.from({ length: count }, () => ({
    code: generateCode(),
    created_by: createdBy,
    batch_name: batchName ?? null,
    redeemed_by: null,
    redeemed_at: null,
    expires_at: null,
    created_at: now,
  }));

  const { data, error } = await supabase
    .from("invite_codes")
    .insert(rows)
    .select();

  if (error) {
    throw new Error(`Failed to create invite codes: ${error.message}`);
  }

  return (data as InviteCodeRow[]).map(rowToInviteCode);
}

/**
 * Validates an invite code without consuming it.
 * Returns flags for the three failure modes so callers can show specific errors.
 */
export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  alreadyUsed: boolean;
  expired: boolean;
}> {
  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !data) {
    return { valid: false, alreadyUsed: false, expired: false };
  }

  const row = data as InviteCodeRow;

  if (row.redeemed_by !== null) {
    return { valid: false, alreadyUsed: true, expired: false };
  }

  if (row.expires_at !== null && new Date(row.expires_at) < new Date()) {
    return { valid: false, alreadyUsed: false, expired: true };
  }

  return { valid: true, alreadyUsed: false, expired: false };
}

/**
 * Marks an invite code as redeemed by a user.
 * Throws if the code is invalid, already used, or expired.
 */
export async function redeemInviteCode(
  code: string,
  redeemedBy: string
): Promise<void> {
  const status = await validateInviteCode(code);

  if (status.alreadyUsed) {
    throw new Error("Invite code has already been used.");
  }
  if (status.expired) {
    throw new Error("Invite code has expired.");
  }
  if (!status.valid) {
    throw new Error("Invalid invite code.");
  }

  const { error } = await supabase
    .from("invite_codes")
    .update({
      redeemed_by: redeemedBy,
      redeemed_at: new Date().toISOString(),
    })
    .eq("code", code);

  if (error) {
    throw new Error(`Failed to redeem invite code: ${error.message}`);
  }
}

/**
 * Returns all invite codes created by the given user, with redemption status.
 */
export async function getUserInviteCodes(
  userId: string
): Promise<InviteCode[]> {
  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as InviteCodeRow[]).map(rowToInviteCode);
}

// ─── Access Requests ──────────────────────────────────────────────────────────

/**
 * Submits a new access request (waitlist / beta application).
 */
export async function createAccessRequest(data: {
  name: string;
  email: string;
  whatBuilding: string;
  howHeard: string;
}): Promise<void> {
  const { error } = await supabase.from("access_requests").insert({
    id: crypto.randomUUID(),
    name: data.name,
    email: data.email,
    what_building: data.whatBuilding,
    how_heard: data.howHeard,
    status: "pending",
    invite_code: null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create access request: ${error.message}`);
  }
}

/**
 * Returns all access requests (admin use).
 */
export async function getAccessRequests(opts?: {
  status?: AccessRequest["status"];
}): Promise<AccessRequest[]> {
  let query = supabase
    .from("access_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (opts?.status) {
    query = query.eq("status", opts.status);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return (data as AccessRequestRow[]).map(rowToAccessRequest);
}
