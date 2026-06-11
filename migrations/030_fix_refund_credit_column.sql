-- Fix: refund_credit RPC references non-existent column layout_md_remaining.
-- The billing columns were never renamed from design_md_remaining.
-- This fixes the RPC to use the actual column name.

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
