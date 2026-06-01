-- Migration: add Claude Opus 4.8 as a user-selectable premium model.
-- Specs mirror Opus 4.7. Idempotent — safe to re-run.

INSERT INTO layout_ai_models
  (id, label, provider, max_output_tokens, credit_cost, input_cost_per_m, output_cost_per_m, byok_only, user_selectable, enabled, is_default, sort_order)
VALUES
  ('claude-opus-4-8', 'Claude Opus 4.8', 'claude', 128000, 5, 5.0, 25.0, false, true, true, false, 2)
ON CONFLICT (id) DO UPDATE
  SET label             = EXCLUDED.label,
      provider          = EXCLUDED.provider,
      max_output_tokens = EXCLUDED.max_output_tokens,
      credit_cost       = EXCLUDED.credit_cost,
      input_cost_per_m  = EXCLUDED.input_cost_per_m,
      output_cost_per_m = EXCLUDED.output_cost_per_m,
      updated_at        = now();
