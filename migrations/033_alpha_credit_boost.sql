-- Alpha credit boost: increase free tier users to 5 layout.md + 100 AI query credits
-- Uses GREATEST so we never reduce credits for users who already have more
-- To revert: set ALPHA_MODE = false in lib/types/billing.ts (credits reset on next period)

UPDATE layout_credit_balance
SET
  design_md_remaining = GREATEST(design_md_remaining, 5),
  test_query_remaining = GREATEST(test_query_remaining, 100)
WHERE user_id NOT IN (
  SELECT user_id FROM layout_subscription
  WHERE tier IN ('pro', 'team') AND status = 'active'
);
