--- Beta invite code system
-- Invite codes, affiliate tracking, and early access requests

CREATE TABLE invite_codes (
  code           TEXT PRIMARY KEY,                          -- 8-char alphanumeric
  created_by     TEXT REFERENCES layout_user(id),           -- NULL for admin-generated
  batch_name     TEXT,                                      -- e.g. "@uiinfluencer" for influencer batches, NULL for user referral codes
  redeemed_by    TEXT REFERENCES layout_user(id),
  redeemed_at    TIMESTAMP WITH TIME ZONE,
  expires_at     TIMESTAMP WITH TIME ZONE,                  -- NULL = no expiry
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE affiliates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,                             -- "@uiinfluencer"
  email          TEXT,
  commission_pct INT DEFAULT 20,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE access_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  what_building  TEXT NOT NULL,
  how_heard      TEXT NOT NULL,
  status         TEXT DEFAULT 'pending',                    -- 'pending' | 'approved' | 'rejected'
  invite_code    TEXT REFERENCES invite_codes(code),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup of a user's own codes
CREATE INDEX invite_codes_created_by_idx ON invite_codes (created_by);

-- Index for access request review queue (pending first)
CREATE INDEX access_requests_status_idx ON access_requests (status, created_at);
