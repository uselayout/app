-- Email suppression list for unsubscribes, bounces, and complaints
CREATE TABLE email_suppression (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  reason     TEXT NOT NULL,  -- 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
  source     TEXT,           -- 'user' | 'webhook' | 'admin'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX email_suppression_email_idx ON email_suppression (email);
