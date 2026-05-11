/**
 * Affiliates, affiliate_conversions, affiliate_payouts — CRUD + aggregations
 *
 * Schema lives in migrations/019_beta_invite_system.sql (initial) and
 * migrations/051_affiliate_payouts.sql (conversions + payouts ledger).
 */

import { supabase } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CommissionTier = "standard" | "flagship";
export type PayoutMethod = "wise" | "stripe-connect" | "paypal" | "manual";

export interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  commissionPct: number;
  commissionTier: CommissionTier;
  payoutEmail: string | null;
  payoutMethod: PayoutMethod | null;
  createdAt: string;
}

export interface AffiliateConversion {
  id: string;
  affiliateId: string;
  userId: string;
  inviteCode: string | null;
  stripeInvoiceId: string;
  invoiceTotalGbp: number;
  monthsSinceRedeem: number;
  commissionPct: number;
  commissionGbp: number;
  invoicePaidAt: string;
  payoutId: string | null;
  createdAt: string;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  periodStart: string;
  periodEnd: string;
  totalGbp: number;
  conversionCount: number;
  paidAt: string | null;
  payoutMethod: string | null;
  payoutReference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AffiliateWithStats extends Affiliate {
  codesIssued: number;
  codesRedeemed: number;
  unpaidConversionsCount: number;
  unpaidCommissionGbp: number;
}

// ─── Row types ────────────────────────────────────────────────────────────────

interface AffiliateRow {
  id: string;
  name: string;
  email: string | null;
  commission_pct: number;
  commission_tier: string;
  payout_email: string | null;
  payout_method: string | null;
  created_at: string;
}

interface ConversionRow {
  id: string;
  affiliate_id: string;
  user_id: string;
  invite_code: string | null;
  stripe_invoice_id: string;
  invoice_total_gbp: string;
  months_since_redeem: number;
  commission_pct: string;
  commission_gbp: string;
  invoice_paid_at: string;
  payout_id: string | null;
  created_at: string;
}

interface PayoutRow {
  id: string;
  affiliate_id: string;
  period_start: string;
  period_end: string;
  total_gbp: string;
  conversion_count: number;
  paid_at: string | null;
  payout_method: string | null;
  payout_reference: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function toAffiliate(row: AffiliateRow): Affiliate {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    commissionPct: row.commission_pct,
    commissionTier: row.commission_tier as CommissionTier,
    payoutEmail: row.payout_email,
    payoutMethod: row.payout_method as PayoutMethod | null,
    createdAt: row.created_at,
  };
}

function toConversion(row: ConversionRow): AffiliateConversion {
  return {
    id: row.id,
    affiliateId: row.affiliate_id,
    userId: row.user_id,
    inviteCode: row.invite_code,
    stripeInvoiceId: row.stripe_invoice_id,
    invoiceTotalGbp: Number(row.invoice_total_gbp),
    monthsSinceRedeem: row.months_since_redeem,
    commissionPct: Number(row.commission_pct),
    commissionGbp: Number(row.commission_gbp),
    invoicePaidAt: row.invoice_paid_at,
    payoutId: row.payout_id,
    createdAt: row.created_at,
  };
}

function toPayout(row: PayoutRow): AffiliatePayout {
  return {
    id: row.id,
    affiliateId: row.affiliate_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    totalGbp: Number(row.total_gbp),
    conversionCount: row.conversion_count,
    paidAt: row.paid_at,
    payoutMethod: row.payout_method,
    payoutReference: row.payout_reference,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

// ─── Affiliates ───────────────────────────────────────────────────────────────

export async function listAffiliatesWithStats(): Promise<AffiliateWithStats[]> {
  const { data: affRows, error: affErr } = await supabase
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });
  if (affErr) throw new Error(`listAffiliates: ${affErr.message}`);

  const affiliates = (affRows ?? []).map(toAffiliate);
  if (affiliates.length === 0) return [];

  const ids = affiliates.map((a) => a.id);

  const { data: codeRows, error: codeErr } = await supabase
    .from("invite_codes")
    .select("affiliate_id, redeemed_at")
    .in("affiliate_id", ids);
  if (codeErr) throw new Error(`listAffiliates codes: ${codeErr.message}`);

  const { data: convRows, error: convErr } = await supabase
    .from("affiliate_conversions")
    .select("affiliate_id, commission_gbp, payout_id")
    .in("affiliate_id", ids)
    .is("payout_id", null);
  if (convErr) throw new Error(`listAffiliates conversions: ${convErr.message}`);

  const codeStats = new Map<string, { issued: number; redeemed: number }>();
  for (const row of codeRows ?? []) {
    const id = row.affiliate_id as string;
    const entry = codeStats.get(id) ?? { issued: 0, redeemed: 0 };
    entry.issued += 1;
    if (row.redeemed_at) entry.redeemed += 1;
    codeStats.set(id, entry);
  }

  const convStats = new Map<string, { count: number; gbp: number }>();
  for (const row of convRows ?? []) {
    const id = row.affiliate_id as string;
    const entry = convStats.get(id) ?? { count: 0, gbp: 0 };
    entry.count += 1;
    entry.gbp += Number(row.commission_gbp);
    convStats.set(id, entry);
  }

  return affiliates.map((a) => {
    const codes = codeStats.get(a.id) ?? { issued: 0, redeemed: 0 };
    const conv = convStats.get(a.id) ?? { count: 0, gbp: 0 };
    return {
      ...a,
      codesIssued: codes.issued,
      codesRedeemed: codes.redeemed,
      unpaidConversionsCount: conv.count,
      unpaidCommissionGbp: conv.gbp,
    };
  });
}

export async function createAffiliate(input: {
  name: string;
  email?: string | null;
  commissionTier: CommissionTier;
  payoutEmail?: string | null;
  payoutMethod?: PayoutMethod | null;
}): Promise<Affiliate> {
  const { data, error } = await supabase
    .from("affiliates")
    .insert({
      name: input.name,
      email: input.email ?? null,
      commission_tier: input.commissionTier,
      payout_email: input.payoutEmail ?? null,
      payout_method: input.payoutMethod ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`createAffiliate: ${error?.message ?? "no row returned"}`);
  return toAffiliate(data);
}

export async function updateAffiliate(
  id: string,
  patch: Partial<{
    name: string;
    email: string | null;
    commissionTier: CommissionTier;
    payoutEmail: string | null;
    payoutMethod: PayoutMethod | null;
  }>
): Promise<Affiliate> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.email !== undefined) update.email = patch.email;
  if (patch.commissionTier !== undefined) update.commission_tier = patch.commissionTier;
  if (patch.payoutEmail !== undefined) update.payout_email = patch.payoutEmail;
  if (patch.payoutMethod !== undefined) update.payout_method = patch.payoutMethod;

  const { data, error } = await supabase
    .from("affiliates")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`updateAffiliate: ${error?.message ?? "no row returned"}`);
  return toAffiliate(data);
}

export async function deleteAffiliate(id: string): Promise<void> {
  const { error } = await supabase.from("affiliates").delete().eq("id", id);
  if (error) throw new Error(`deleteAffiliate: ${error.message}`);
}

// ─── Conversions ──────────────────────────────────────────────────────────────

export async function listUnpaidConversions(): Promise<AffiliateConversion[]> {
  const { data, error } = await supabase
    .from("affiliate_conversions")
    .select("*")
    .is("payout_id", null)
    .order("invoice_paid_at", { ascending: false });
  if (error) throw new Error(`listUnpaidConversions: ${error.message}`);
  return (data ?? []).map(toConversion);
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export async function listPayouts(): Promise<AffiliatePayout[]> {
  const { data, error } = await supabase
    .from("affiliate_payouts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listPayouts: ${error.message}`);
  return (data ?? []).map(toPayout);
}

/**
 * Close a payout: bundles all unpaid conversions for an affiliate into one
 * payout row and stamps payout_id back on each conversion. Returns the new
 * payout. The bundling and stamping run in a single transaction via RPC is
 * preferred, but Supabase JS doesn't expose multi-statement transactions,
 * so we accept that a webhook arriving mid-flight could attribute a
 * conversion to the wrong (next) payout. That's tolerable because:
 *   1. Conversions are rare relative to payout closes
 *   2. The stamping happens after the payout row is created — a webhook
 *      mid-flight would leave the new conversion with payout_id NULL,
 *      eligible for the next payout.
 */
export async function createPayout(input: {
  affiliateId: string;
  payoutMethod?: string | null;
  payoutReference?: string | null;
  notes?: string | null;
}): Promise<AffiliatePayout> {
  const { data: convRows, error: convErr } = await supabase
    .from("affiliate_conversions")
    .select("id, commission_gbp, invoice_paid_at")
    .eq("affiliate_id", input.affiliateId)
    .is("payout_id", null)
    .order("invoice_paid_at", { ascending: true });
  if (convErr) throw new Error(`createPayout conversions: ${convErr.message}`);

  const unpaid = convRows ?? [];
  if (unpaid.length === 0) {
    throw new Error("No unpaid conversions for this affiliate");
  }

  const total = unpaid.reduce((sum, r) => sum + Number(r.commission_gbp), 0);
  const periodStart = unpaid[0].invoice_paid_at.slice(0, 10);
  const periodEnd = unpaid[unpaid.length - 1].invoice_paid_at.slice(0, 10);

  const { data: payoutRow, error: payoutErr } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_id: input.affiliateId,
      period_start: periodStart,
      period_end: periodEnd,
      total_gbp: total.toFixed(2),
      conversion_count: unpaid.length,
      payout_method: input.payoutMethod ?? null,
      payout_reference: input.payoutReference ?? null,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (payoutErr || !payoutRow) {
    throw new Error(`createPayout insert: ${payoutErr?.message ?? "no row returned"}`);
  }

  const { error: stampErr } = await supabase
    .from("affiliate_conversions")
    .update({ payout_id: payoutRow.id })
    .in(
      "id",
      unpaid.map((r) => r.id)
    );
  if (stampErr) {
    // Best-effort rollback: delete the orphan payout row.
    await supabase.from("affiliate_payouts").delete().eq("id", payoutRow.id);
    throw new Error(`createPayout stamp: ${stampErr.message}`);
  }

  return toPayout(payoutRow);
}

export async function markPayoutPaid(
  id: string,
  patch: { paidAt: string; payoutMethod?: string | null; payoutReference?: string | null }
): Promise<AffiliatePayout> {
  const { data, error } = await supabase
    .from("affiliate_payouts")
    .update({
      paid_at: patch.paidAt,
      payout_method: patch.payoutMethod ?? null,
      payout_reference: patch.payoutReference ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`markPayoutPaid: ${error?.message ?? "no row returned"}`);
  return toPayout(data);
}

// ─── Codes for an affiliate ───────────────────────────────────────────────────

export async function generateCodesForAffiliate(
  affiliateId: string,
  count: number,
  createdBy: string | null
): Promise<string[]> {
  // Look up affiliate name to use as batch_name (human-readable).
  const { data: aff, error: affErr } = await supabase
    .from("affiliates")
    .select("name")
    .eq("id", affiliateId)
    .single();
  if (affErr || !aff) throw new Error(`affiliate not found: ${affErr?.message ?? "no row"}`);

  const codes: { code: string; batch_name: string; affiliate_id: string; created_by: string | null }[] = [];
  for (let i = 0; i < count; i++) {
    codes.push({
      code: makeCode(),
      batch_name: aff.name,
      affiliate_id: affiliateId,
      created_by: createdBy,
    });
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .insert(codes)
    .select("code");
  if (error) throw new Error(`generateCodesForAffiliate: ${error.message}`);
  return (data ?? []).map((r) => r.code as string);
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

// ─── Commission recording (called from Stripe webhook) ────────────────────────

/**
 * Compute commission percentage for a tier given how many months have
 * elapsed since the user redeemed the invite code.
 *
 *   standard: flat 20%
 *   flagship: 40% month 1, 35% months 2-12, 30% month 13+
 *
 * monthsSinceRedeem is integer months, 1-indexed for the redemption month.
 */
export function commissionPctFor(tier: CommissionTier, monthsSinceRedeem: number): number {
  if (tier === "standard") return 20;
  if (monthsSinceRedeem <= 1) return 40;
  if (monthsSinceRedeem <= 12) return 35;
  return 30;
}

/**
 * Whole months between two ISO dates. Month 1 = redemption month itself.
 * Uses calendar-month difference so monthly billing aligns naturally.
 */
export function monthsBetween(redeemedAt: string, paidAt: string): number {
  const a = new Date(redeemedAt);
  const b = new Date(paidAt);
  const months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  return Math.max(1, months + 1);
}

export interface RecordConversionInput {
  userId: string;
  stripeInvoiceId: string;
  invoiceTotalGbp: number;
  invoicePaidAt: string; // ISO timestamp
}

export interface RecordConversionResult {
  attributed: boolean;
  reason?: string;
  conversionId?: string;
}

/**
 * Record a paid Stripe invoice as an affiliate conversion if the user
 * redeemed an affiliate-attributed invite code. Idempotent on
 * stripe_invoice_id (unique constraint at the DB level + ON CONFLICT
 * handling here). Safe to call for every paid invoice; returns
 * `attributed: false` when there's no affiliate to attribute to.
 */
export async function recordAffiliateConversion(
  input: RecordConversionInput
): Promise<RecordConversionResult> {
  // 1. Find an attributed invite code the user redeemed.
  const { data: codeRow, error: codeErr } = await supabase
    .from("invite_codes")
    .select("code, affiliate_id, redeemed_at")
    .eq("redeemed_by", input.userId)
    .not("affiliate_id", "is", null)
    .order("redeemed_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (codeErr) {
    throw new Error(`recordAffiliateConversion lookup: ${codeErr.message}`);
  }
  if (!codeRow || !codeRow.affiliate_id || !codeRow.redeemed_at) {
    return { attributed: false, reason: "no-attributed-code" };
  }

  // 2. Resolve commission tier.
  const { data: affRow, error: affErr } = await supabase
    .from("affiliates")
    .select("commission_tier")
    .eq("id", codeRow.affiliate_id)
    .single();
  if (affErr || !affRow) {
    throw new Error(`recordAffiliateConversion affiliate: ${affErr?.message ?? "missing"}`);
  }

  const tier = affRow.commission_tier as CommissionTier;
  const months = monthsBetween(codeRow.redeemed_at, input.invoicePaidAt);
  const pct = commissionPctFor(tier, months);
  const commissionGbp = Math.round(input.invoiceTotalGbp * pct) / 100;

  // 3. Insert. Idempotent on stripe_invoice_id UNIQUE constraint.
  const { data: convRow, error: insertErr } = await supabase
    .from("affiliate_conversions")
    .insert({
      affiliate_id: codeRow.affiliate_id,
      user_id: input.userId,
      invite_code: codeRow.code,
      stripe_invoice_id: input.stripeInvoiceId,
      invoice_total_gbp: input.invoiceTotalGbp.toFixed(2),
      months_since_redeem: months,
      commission_pct: pct,
      commission_gbp: commissionGbp.toFixed(2),
      invoice_paid_at: input.invoicePaidAt,
    })
    .select("id")
    .single();

  if (insertErr) {
    // 23505 = unique_violation. Treat as already-recorded (Stripe retry).
    if (insertErr.code === "23505") {
      return { attributed: true, reason: "already-recorded" };
    }
    throw new Error(`recordAffiliateConversion insert: ${insertErr.message}`);
  }

  return { attributed: true, conversionId: convRow.id };
}
