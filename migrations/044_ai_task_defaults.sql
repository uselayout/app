-- Migration: AI task-to-model defaults
-- Configurable from admin panel. Each task type maps to a model ID.

CREATE TABLE IF NOT EXISTS layout_ai_task_defaults (
  task text PRIMARY KEY,
  model_id text NOT NULL REFERENCES layout_ai_models(id),
  updated_at timestamptz DEFAULT now()
);

-- Seed with current hardcoded defaults
INSERT INTO layout_ai_task_defaults (task, model_id)
VALUES
  ('extraction', 'claude-sonnet-4-6'),
  ('editor', 'claude-sonnet-4-6'),
  ('simple-edit', 'claude-haiku-4-5-20251001')
ON CONFLICT (task) DO NOTHING;
