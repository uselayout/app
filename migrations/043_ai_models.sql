-- Migration: AI Models registry (DB-driven model management)
-- Allows adding/updating AI models from admin without redeploying.

CREATE TABLE IF NOT EXISTS layout_ai_models (
  id text PRIMARY KEY,
  label text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('claude', 'gemini')),
  max_output_tokens integer NOT NULL DEFAULT 32000,
  credit_cost integer NOT NULL DEFAULT 1,
  input_cost_per_m numeric(10,4) NOT NULL DEFAULT 0,
  output_cost_per_m numeric(10,4) NOT NULL DEFAULT 0,
  byok_only boolean NOT NULL DEFAULT false,
  user_selectable boolean NOT NULL DEFAULT true,
  enabled boolean NOT NULL DEFAULT true,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed with current models
INSERT INTO layout_ai_models (id, label, provider, max_output_tokens, credit_cost, input_cost_per_m, output_cost_per_m, byok_only, user_selectable, enabled, is_default, sort_order)
VALUES
  ('claude-sonnet-4-6', 'Claude Sonnet 4.6', 'claude', 64000, 1, 3.0, 15.0, false, true, true, true, 0),
  ('claude-opus-4-7', 'Claude Opus 4.7', 'claude', 32000, 5, 15.0, 75.0, false, true, true, false, 1),
  ('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'claude', 8192, 1, 0.80, 4.0, false, false, true, false, 2),
  ('gemini-3.1-pro-preview', 'Gemini 3.1 Pro', 'gemini', 65536, 0, 0, 0, true, true, true, false, 3)
ON CONFLICT (id) DO NOTHING;

-- Updated deduct credit function that accepts an amount parameter
CREATE OR REPLACE FUNCTION layout_deduct_credit_amount(
  p_user_id text,
  p_type text,
  p_amount integer DEFAULT 1
) RETURNS boolean AS $$
DECLARE
  v_monthly integer;
  v_topup integer;
  v_deduct_monthly integer;
  v_deduct_topup integer;
BEGIN
  -- Get current balances
  IF p_type = 'design_md' THEN
    SELECT design_md_remaining, topup_design_md INTO v_monthly, v_topup
    FROM layout_credit_balance WHERE user_id = p_user_id FOR UPDATE;
  ELSIF p_type = 'test_query' THEN
    SELECT test_query_remaining, topup_test_query INTO v_monthly, v_topup
    FROM layout_credit_balance WHERE user_id = p_user_id FOR UPDATE;
  ELSE
    RETURN false;
  END IF;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Check total is enough
  IF (COALESCE(v_monthly, 0) + COALESCE(v_topup, 0)) < p_amount THEN
    RETURN false;
  END IF;

  -- Deduct from monthly first, overflow to topup
  v_deduct_monthly := LEAST(p_amount, COALESCE(v_monthly, 0));
  v_deduct_topup := p_amount - v_deduct_monthly;

  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET design_md_remaining = design_md_remaining - v_deduct_monthly,
        topup_design_md = topup_design_md - v_deduct_topup
    WHERE user_id = p_user_id;
  ELSE
    UPDATE layout_credit_balance
    SET test_query_remaining = test_query_remaining - v_deduct_monthly,
        topup_test_query = topup_test_query - v_deduct_topup
    WHERE user_id = p_user_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Org version
CREATE OR REPLACE FUNCTION layout_deduct_credit_amount_org(
  p_org_id text,
  p_type text,
  p_amount integer DEFAULT 1
) RETURNS boolean AS $$
DECLARE
  v_monthly integer;
  v_topup integer;
  v_deduct_monthly integer;
  v_deduct_topup integer;
BEGIN
  IF p_type = 'design_md' THEN
    SELECT design_md_remaining, topup_design_md INTO v_monthly, v_topup
    FROM layout_credit_balance WHERE org_id = p_org_id FOR UPDATE;
  ELSIF p_type = 'test_query' THEN
    SELECT test_query_remaining, topup_test_query INTO v_monthly, v_topup
    FROM layout_credit_balance WHERE org_id = p_org_id FOR UPDATE;
  ELSE
    RETURN false;
  END IF;

  IF NOT FOUND THEN RETURN false; END IF;

  IF (COALESCE(v_monthly, 0) + COALESCE(v_topup, 0)) < p_amount THEN
    RETURN false;
  END IF;

  v_deduct_monthly := LEAST(p_amount, COALESCE(v_monthly, 0));
  v_deduct_topup := p_amount - v_deduct_monthly;

  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET design_md_remaining = design_md_remaining - v_deduct_monthly,
        topup_design_md = topup_design_md - v_deduct_topup
    WHERE org_id = p_org_id;
  ELSE
    UPDATE layout_credit_balance
    SET test_query_remaining = test_query_remaining - v_deduct_monthly,
        topup_test_query = topup_test_query - v_deduct_topup
    WHERE org_id = p_org_id;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;
