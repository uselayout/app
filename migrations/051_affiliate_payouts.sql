-- 051_affiliate_payouts.sql
-- Extends affiliate tracking from migration 019:
--   - Stepped commission tiers on affiliates
--   - Conversions ledger (one row per paid Stripe invoice, idempotent on invoice id)
--   - Payouts ledger (one row per transfer to an affiliate)
-- All changes are additive. Existing rows continue to work unchanged.
-- Idempotent: safe to re-run.

BEGIN;

-- 1. Link invite_codes to affiliates by id. The string batch_name stays
--    for human-readable purposes but is no longer the join key.
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);

CREATE INDEX IF NOT EXISTS idx_invite_codes_affiliate
  ON invite_codes(affiliate_id);

-- 2. Stepped commission tier + payout metadata on affiliates.
ALTER TABLE affiliates
  ADD COLUMN IF NOT EXISTS commission_tier TEXT
    NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS payout_email TEXT,
  ADD COLUMN IF NOT EXISTS payout_method TEXT;

-- Add CHECK constraints in a guarded DO block (PG < 16 lacks
-- ADD CONSTRAINT IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_commission_tier_check'
  ) THEN
    ALTER TABLE affiliates
      ADD CONSTRAINT affiliates_commission_tier_check
      CHECK (commission_tier IN ('standard', 'flagship'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'affiliates_payout_method_check'
  ) THEN
    ALTER TABLE affiliates
      ADD CONSTRAINT affiliates_payout_method_check
      CHECK (
        payout_method IS NULL
        OR payout_method IN ('wise', 'stripe-connect', 'paypal', 'manual')
      );
  END IF;
END
$$;

-- 3. Payouts ledger first, so 4 can reference it inline.
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id       UUID NOT NULL REFERENCES affiliates(id),
  period_start       DATE NOT NULL,
  period_end         DATE NOT NULL,
  total_gbp          NUMERIC(10,2) NOT NULL,
  conversion_count   INT NOT NULL,
  paid_at            TIMESTAMPTZ,
  payout_method      TEXT,
  payout_reference   TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_affiliate
  ON affiliate_payouts(affiliate_id);

-- 4. Conversions ledger. Idempotent on stripe_invoice_id so webhook retries
--    don't double-count. payout_id is stamped when a payout closes the row.
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id        UUID NOT NULL REFERENCES affiliates(id),
  user_id             TEXT NOT NULL REFERENCES layout_user(id),
  invite_code         TEXT REFERENCES invite_codes(code),
  stripe_invoice_id   TEXT NOT NULL UNIQUE,
  invoice_total_gbp   NUMERIC(10,2) NOT NULL,
  months_since_redeem INT NOT NULL,
  commission_pct      NUMERIC(5,2) NOT NULL,
  commission_gbp      NUMERIC(10,2) NOT NULL,
  invoice_paid_at     TIMESTAMPTZ NOT NULL,
  payout_id           UUID REFERENCES affiliate_payouts(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversions_affiliate
  ON affiliate_conversions(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_conversions_affiliate_unpaid
  ON affiliate_conversions(affiliate_id) WHERE payout_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_conversions_user
  ON affiliate_conversions(user_id);

COMMIT;
