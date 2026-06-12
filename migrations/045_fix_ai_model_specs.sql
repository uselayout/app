-- Migration: correct stale AI model specs for Opus 4.7 and Haiku 4.5
-- Per https://platform.claude.com/docs/en/about-claude/models/overview
-- Idempotent — safe to re-run.

UPDATE layout_ai_models
SET max_output_tokens = 128000,
    input_cost_per_m  = 5.0,
    output_cost_per_m = 25.0,
    updated_at = now()
WHERE id = 'claude-opus-4-7';

UPDATE layout_ai_models
SET max_output_tokens = 64000,
    input_cost_per_m  = 1.0,
    output_cost_per_m = 5.0,
    updated_at = now()
WHERE id = 'claude-haiku-4-5-20251001';
