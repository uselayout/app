-- Email log: track all emails sent per access request
CREATE TABLE email_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_request_id UUID NOT NULL REFERENCES access_requests(id),
  email_type        TEXT NOT NULL,  -- 'welcome' | 'reminder' | 'final_reminder'
  sent_at           TIMESTAMPTZ DEFAULT now(),
  from_email        TEXT,
  resend_id         TEXT
);

CREATE INDEX email_log_request_idx ON email_log (access_request_id, email_type);

-- Backfill: existing approved requests already received a welcome email
INSERT INTO email_log (access_request_id, email_type, sent_at)
SELECT id, 'welcome', created_at
FROM access_requests
WHERE status = 'approved';
