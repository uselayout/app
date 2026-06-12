-- Webhook event idempotency table
-- Prevents double-processing of Stripe webhook retries
CREATE TABLE IF NOT EXISTS layout_webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_stripe_id ON layout_webhook_events (stripe_event_id);
