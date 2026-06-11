-- Rebrand: SuperDuper AI Studio -> Layout (layout.design)
-- Strategy: Create new tables, copy data, deploy code, then drop old tables after 7 days.

-- Step 1: Create new tables (copies structure including indexes/constraints)
CREATE TABLE IF NOT EXISTS layout_user (LIKE sd_aistudio_user INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_session (LIKE sd_aistudio_session INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_account (LIKE sd_aistudio_account INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_verification (LIKE sd_aistudio_verification INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_projects (LIKE sd_aistudio_projects INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_subscription (LIKE sd_aistudio_subscription INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_usage_log (LIKE sd_aistudio_usage_log INCLUDING ALL);
CREATE TABLE IF NOT EXISTS layout_credit_balance (LIKE sd_aistudio_credit_balance INCLUDING ALL);

-- Step 2: Copy all existing data
INSERT INTO layout_user SELECT * FROM sd_aistudio_user ON CONFLICT DO NOTHING;
INSERT INTO layout_session SELECT * FROM sd_aistudio_session ON CONFLICT DO NOTHING;
INSERT INTO layout_account SELECT * FROM sd_aistudio_account ON CONFLICT DO NOTHING;
INSERT INTO layout_verification SELECT * FROM sd_aistudio_verification ON CONFLICT DO NOTHING;
INSERT INTO layout_projects SELECT * FROM sd_aistudio_projects ON CONFLICT DO NOTHING;
INSERT INTO layout_subscription SELECT * FROM sd_aistudio_subscription ON CONFLICT DO NOTHING;
INSERT INTO layout_usage_log SELECT * FROM sd_aistudio_usage_log ON CONFLICT DO NOTHING;
INSERT INTO layout_credit_balance SELECT * FROM sd_aistudio_credit_balance ON CONFLICT DO NOTHING;

-- Step 3: Recreate the stored function with new table name
CREATE OR REPLACE FUNCTION layout_deduct_credit(
  p_user_id text, p_type text
) RETURNS boolean AS $$
BEGIN
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance SET design_md_remaining = design_md_remaining - 1
    WHERE user_id = p_user_id AND design_md_remaining > 0;
  ELSIF p_type = 'test_query' THEN
    UPDATE layout_credit_balance SET test_query_remaining = test_query_remaining - 1
    WHERE user_id = p_user_id AND test_query_remaining > 0;
  ELSE RETURN false;
  END IF;
  IF FOUND THEN RETURN true; END IF;
  IF p_type = 'design_md' THEN
    UPDATE layout_credit_balance SET topup_design_md = topup_design_md - 1
    WHERE user_id = p_user_id AND topup_design_md > 0;
  ELSE
    UPDATE layout_credit_balance SET topup_test_query = topup_test_query - 1
    WHERE user_id = p_user_id AND topup_test_query > 0;
  END IF;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;
