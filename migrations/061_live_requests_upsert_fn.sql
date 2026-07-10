-- 061: Layout Live request upsert function + DB clock helper
--
-- Replaces the API route's supabase-js upsert with an RPC so that:
--
--   * updated_at is stamped by the DATABASE (clock_timestamp()), not the
--     app server's wall clock, so the delta-pull cursor and the row
--     timestamps share one clock. clock_timestamp() advances per call, so
--     rows upserted in one statement get distinct updated_at values, which
--     keeps the (updated_at, request_id) pull ordering free of batch-wide
--     tie groups at page boundaries.
--
--   * created_at is write-once: set on the first INSERT only (client value
--     or now()); the ON CONFLICT update never touches it, so a later push
--     cannot rewrite when a request was created.
--
-- layout_live_db_now() lets the API return a DB timestamp as the pull
-- cursor when a push upserts zero rows or a pull page is not full.
--
-- Apply to staging:
--   cat migrations/061_live_requests_upsert_fn.sql | \
--     ssh root@94.130.130.22 "docker exec -i supabase-db-<service> psql -U postgres"

CREATE OR REPLACE FUNCTION layout_live_upsert_requests(
  p_org_id      UUID,
  p_project_ref TEXT,
  p_rows        JSONB
) RETURNS TABLE (request_id TEXT, updated_at TIMESTAMPTZ)
LANGUAGE plpgsql AS $$
DECLARE
  r JSONB;
BEGIN
  FOR r IN SELECT jsonb_array_elements(p_rows) LOOP
    RETURN QUERY
    INSERT INTO layout_live_requests AS t (
      org_id, project_ref, request_id, message, status, target, history,
      device_label, deleted, created_at, updated_at
    ) VALUES (
      p_org_id,
      p_project_ref,
      r->>'request_id',
      r->>'message',
      r->>'status',
      COALESCE(r->'target', '{}'::jsonb),
      COALESCE(r->'history', '[]'::jsonb),
      r->>'device_label',
      COALESCE((r->>'deleted')::boolean, false),
      COALESCE((r->>'created_at')::timestamptz, now()),
      clock_timestamp()
    )
    -- Conflict target named via the constraint rather than a column list:
    -- plpgsql would treat request_id in an inference list as ambiguous
    -- with the OUT parameter of the same name.
    ON CONFLICT ON CONSTRAINT layout_live_requests_pkey DO UPDATE SET
      message      = EXCLUDED.message,
      status       = EXCLUDED.status,
      target       = EXCLUDED.target,
      history      = EXCLUDED.history,
      device_label = EXCLUDED.device_label,
      deleted      = EXCLUDED.deleted,
      -- created_at deliberately NOT updated: write-once.
      updated_at   = clock_timestamp()
    RETURNING t.request_id, t.updated_at;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION layout_live_db_now()
RETURNS TIMESTAMPTZ
LANGUAGE sql AS $$
  SELECT now();
$$;
