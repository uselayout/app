-- Refund one credit atomically after a failed stream.
-- Inverse of layout_deduct_credit: increments the monthly counter by 1.
-- Returns true on success.

CREATE OR REPLACE FUNCTION layout_refund_credit(
  p_user_id UUID,
  p_type TEXT -- 'layout_md' or 'test_query'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  col_name TEXT;
BEGIN
  IF p_type = 'layout_md' THEN
    col_name := 'layout_md_remaining';
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
