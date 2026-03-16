-- Migration: Billing tables for Layout
-- Run against Supabase PostgreSQL

-- Subscriptions
CREATE TABLE IF NOT EXISTS sd_aistudio_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free',
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  seat_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_user_id ON sd_aistudio_subscription (user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_stripe_customer ON sd_aistudio_subscription (stripe_customer_id);

-- Credit balances
CREATE TABLE IF NOT EXISTS sd_aistudio_credit_balance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  design_md_remaining integer NOT NULL DEFAULT 0,
  test_query_remaining integer NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  topup_design_md integer NOT NULL DEFAULT 0,
  topup_test_query integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_credit_balance_user_id ON sd_aistudio_credit_balance (user_id);

-- Usage logs
CREATE TABLE IF NOT EXISTS sd_aistudio_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  project_id text,
  endpoint text NOT NULL,
  mode text NOT NULL,
  input_tokens integer NOT NULL,
  output_tokens integer NOT NULL,
  model text NOT NULL,
  cost_estimate_gbp numeric(10,6),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_usage_log_user_created ON sd_aistudio_usage_log (user_id, created_at);

-- Atomic credit deduction function
-- Tries monthly credits first, falls back to top-up credits
-- Returns true if a credit was successfully deducted
CREATE OR REPLACE FUNCTION sd_aistudio_deduct_credit(
  p_user_id text,
  p_type text -- 'design_md' or 'test_query'
) RETURNS boolean AS $$
BEGIN
  -- Try monthly credits first
  IF p_type = 'design_md' THEN
    UPDATE sd_aistudio_credit_balance
    SET design_md_remaining = design_md_remaining - 1
    WHERE user_id = p_user_id AND design_md_remaining > 0;
  ELSIF p_type = 'test_query' THEN
    UPDATE sd_aistudio_credit_balance
    SET test_query_remaining = test_query_remaining - 1
    WHERE user_id = p_user_id AND test_query_remaining > 0;
  ELSE
    RETURN false;
  END IF;

  IF FOUND THEN RETURN true; END IF;

  -- Fall back to top-up credits
  IF p_type = 'design_md' THEN
    UPDATE sd_aistudio_credit_balance
    SET topup_design_md = topup_design_md - 1
    WHERE user_id = p_user_id AND topup_design_md > 0;
  ELSE
    UPDATE sd_aistudio_credit_balance
    SET topup_test_query = topup_test_query - 1
    WHERE user_id = p_user_id AND topup_test_query > 0;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
