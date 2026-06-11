-- Enable Row Level Security on all layout tables.
--
-- Our server uses the service_role key which bypasses RLS entirely.
-- The publicly-visible anon key should have ZERO access to any table.
-- This migration enables RLS with no permissive policies for the anon role,
-- effectively locking out direct Supabase client access via the anon key.
--
-- If you need the anon key to access specific tables in the future (e.g. for
-- client-side real-time subscriptions), add explicit policies per table.

-- Auth tables (Better Auth)
ALTER TABLE layout_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_verification ENABLE ROW LEVEL SECURITY;

-- Core project data
ALTER TABLE layout_projects ENABLE ROW LEVEL SECURITY;

-- Billing
ALTER TABLE layout_subscription ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_credit_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_usage_log ENABLE ROW LEVEL SECURITY;

-- Organisations
ALTER TABLE layout_organization ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_organization_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_invitation ENABLE ROW LEVEL SECURITY;

-- Components & library
ALTER TABLE layout_component ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_component_version ENABLE ROW LEVEL SECURITY;

-- API keys
ALTER TABLE layout_api_key ENABLE ROW LEVEL SECURITY;

-- Figma
ALTER TABLE layout_figma_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_figma_capture ENABLE ROW LEVEL SECURITY;

-- Design system artefacts
ALTER TABLE layout_token ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_typeface ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_type_scale ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_icon ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_template ENABLE ROW LEVEL SECURITY;

-- Quality & analytics
ALTER TABLE layout_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_candidate_comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_drift_report ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_analytics_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE layout_audit_log ENABLE ROW LEVEL SECURITY;

-- Versioning (renamed from layout_design_md_versions in migration 024)
ALTER TABLE layout_md_versions ENABLE ROW LEVEL SECURITY;

-- Webhooks
ALTER TABLE layout_webhook_events ENABLE ROW LEVEL SECURITY;

-- Webhook config (may have been created manually outside migrations)
DO $$ BEGIN
  ALTER TABLE layout_webhook_config ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Beta invite system (non-prefixed tables)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
