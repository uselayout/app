-- 047_capture_manual_prod_schema.sql
--
-- Captures three tables that exist on production but were never captured
-- cleanly in a migration file:
--   * affiliates           - originally defined in 019, but 019 is flagged
--                            applied on staging while the table is missing
--                            there. This re-creates it on any environment
--                            that lacks it.
--   * email_log            - same story with 029.
--   * layout_webhook_config - never added via a migration file at all;
--                            created manually on production to back the
--                            /api/organizations/[orgId]/webhook-config
--                            routes.
--
-- Idempotent: no-op on production (where all three tables already exist),
-- brings staging up to parity. Schemas match the exact DDL pulled from
-- production with pg_dump.

CREATE TABLE IF NOT EXISTS affiliates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text,
  commission_pct integer DEFAULT 20,
  created_at     timestamp with time zone DEFAULT now()
);

-- Production enables RLS on affiliates with no policy (admin-only access
-- via the service-role key). Mirror that.
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS email_log (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_request_id  uuid NOT NULL REFERENCES access_requests(id),
  email_type         text NOT NULL,
  sent_at            timestamp with time zone DEFAULT now(),
  from_email         text,
  resend_id          text
);

CREATE INDEX IF NOT EXISTS email_log_request_idx
  ON email_log (access_request_id, email_type);

CREATE TABLE IF NOT EXISTS layout_webhook_config (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  text NOT NULL,
  provider                text NOT NULL,
  webhook_id              text,
  passcode                text NOT NULL,
  github_owner            text,
  github_repo             text,
  github_branch           text DEFAULT 'main',
  github_token_encrypted  text,
  enabled                 boolean DEFAULT true,
  created_at              timestamp with time zone DEFAULT now(),
  updated_at              timestamp with time zone DEFAULT now()
);

INSERT INTO layout_migrations (name)
VALUES ('047_capture_manual_prod_schema.sql')
ON CONFLICT (name) DO NOTHING;
