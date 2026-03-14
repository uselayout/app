-- Migration 006: Create personal orgs for existing users, backfill org_id

-- Create a personal org for every existing user
INSERT INTO layout_organization (name, slug, owner_id)
SELECT
  'Personal',
  'personal-' || u.id,
  u.id
FROM layout_user u
WHERE NOT EXISTS (
  SELECT 1 FROM layout_organization o WHERE o.owner_id = u.id
)
ON CONFLICT DO NOTHING;

-- Add owner as member of their personal org
INSERT INTO layout_organization_member (org_id, user_id, role)
SELECT o.id, o.owner_id, 'owner'
FROM layout_organization o
WHERE NOT EXISTS (
  SELECT 1 FROM layout_organization_member m
  WHERE m.org_id = o.id AND m.user_id = o.owner_id
)
ON CONFLICT DO NOTHING;

-- Backfill org_id on projects
UPDATE layout_projects p
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = p.user_id
  AND o.slug LIKE 'personal-%'
  AND p.org_id IS NULL;

-- Backfill org_id on subscriptions
UPDATE layout_subscription s
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = s.user_id
  AND o.slug LIKE 'personal-%'
  AND s.org_id IS NULL;

-- Backfill org_id on credit balances
UPDATE layout_credit_balance cb
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = cb.user_id
  AND o.slug LIKE 'personal-%'
  AND cb.org_id IS NULL;

-- Backfill org_id on usage logs
UPDATE layout_usage_log ul
SET org_id = o.id
FROM layout_organization o
WHERE o.owner_id = ul.user_id
  AND o.slug LIKE 'personal-%'
  AND ul.org_id IS NULL;

-- Now make org_id NOT NULL on projects
ALTER TABLE layout_projects ALTER COLUMN org_id SET NOT NULL;

-- Create org-scoped credit deduction function
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

  -- Fall back to top-up credits
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

-- Add indexes for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_projects_org ON layout_projects (org_id);
CREATE INDEX IF NOT EXISTS idx_subscription_org ON layout_subscription (org_id);
CREATE INDEX IF NOT EXISTS idx_credit_balance_org ON layout_credit_balance (org_id);
CREATE INDEX IF NOT EXISTS idx_usage_log_org ON layout_usage_log (org_id);
