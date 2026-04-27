-- Migration 050: restore credit-deduction RPCs missing on production
--
-- Production is missing layout_deduct_credit, layout_deduct_credit_org, and
-- layout_refund_credit (originally defined in migrations 002, 006, 028).
-- Their absence makes deductCredit() in lib/billing/credits.ts return false
-- for every default (creditCost = 1) call, which surfaces as a 402 to the
-- user despite a non-zero balance.
--
-- This migration is idempotent: CREATE OR REPLACE FUNCTION can be re-run
-- safely on staging (which already has these) and prod.

-- Single-credit deduction. Tries the monthly counter first, falls back to top-up.
CREATE OR REPLACE FUNCTION layout_deduct_credit(
  p_user_id text,
  p_type text
) RETURNS boolean AS $$
BEGIN
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET design_md_remaining = design_md_remaining - 1
    WHERE user_id = p_user_id AND design_md_remaining > 0;
  ELSIF p_type = 'test_query' THEN
    UPDATE layout_credit_balance
    SET test_query_remaining = test_query_remaining - 1
    WHERE user_id = p_user_id AND test_query_remaining > 0;
  ELSE
    RETURN false;
  END IF;

  IF FOUND THEN RETURN true; END IF;

  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET topup_design_md = topup_design_md - 1
    WHERE user_id = p_user_id AND topup_design_md > 0;
  ELSE
    UPDATE layout_credit_balance
    SET topup_test_query = topup_test_query - 1
    WHERE user_id = p_user_id AND topup_test_query > 0;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Org-scoped variant (same shape, keyed on org_id).
CREATE OR REPLACE FUNCTION layout_deduct_credit_org(
  p_org_id UUID,
  p_type TEXT
) RETURNS boolean AS $$
BEGIN
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET design_md_remaining = design_md_remaining - 1
    WHERE org_id = p_org_id AND design_md_remaining > 0;
  ELSIF p_type = 'test_query' THEN
    UPDATE layout_credit_balance
    SET test_query_remaining = test_query_remaining - 1
    WHERE org_id = p_org_id AND test_query_remaining > 0;
  ELSE
    RETURN false;
  END IF;

  IF FOUND THEN RETURN true; END IF;

  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance
    SET topup_design_md = topup_design_md - 1
    WHERE org_id = p_org_id AND topup_design_md > 0;
  ELSE
    UPDATE layout_credit_balance
    SET topup_test_query = topup_test_query - 1
    WHERE org_id = p_org_id AND topup_test_query > 0;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Refund one credit after a failed stream. Inverse of layout_deduct_credit:
-- increments the monthly counter by 1. Body matches migration 030 verbatim.
CREATE OR REPLACE FUNCTION layout_refund_credit(
  p_user_id UUID,
  p_type TEXT -- 'design_md' or 'test_query'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  col_name TEXT;
BEGIN
  IF p_type = 'design_md' THEN
    col_name := 'design_md_remaining';
  ELSIF p_type = 'test_query' THEN
    col_name := 'test_query_remaining';
  ELSE
    RETURN FALSE;
  END IF;

  EXECUTE format(
    'UPDATE layout_credit_balance SET %I = %I + 1 WHERE user_id = $1',
    col_name, col_name
  ) USING p_user_id;

  RETURN FOUND;
END;
$$;
