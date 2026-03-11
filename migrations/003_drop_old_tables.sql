-- Run this 7 days AFTER deploying the rebrand to drop old SuperDuper tables.
-- Verify the app is stable on layout_* tables before running.

DROP TABLE IF EXISTS sd_aistudio_session CASCADE;
DROP TABLE IF EXISTS sd_aistudio_account CASCADE;
DROP TABLE IF EXISTS sd_aistudio_verification CASCADE;
DROP TABLE IF EXISTS sd_aistudio_subscription CASCADE;
DROP TABLE IF EXISTS sd_aistudio_usage_log CASCADE;
DROP TABLE IF EXISTS sd_aistudio_credit_balance CASCADE;
DROP TABLE IF EXISTS sd_aistudio_projects CASCADE;
DROP TABLE IF EXISTS sd_aistudio_user CASCADE;
DROP FUNCTION IF EXISTS sd_aistudio_deduct_credit;
