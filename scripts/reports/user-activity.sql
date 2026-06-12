-- User activity report (production)
-- Combines waitlist (access_requests) + accounts (layout_user) and counts
-- per-user layout.md projects, saved components, and generated variants.
-- Outputs CSV on psql stdout via COPY ... TO STDOUT.

COPY (
  WITH waitlist AS (
    SELECT lower(email) AS email_key, name, email,
           status AS waitlist_status, invite_code,
           created_at AS waitlist_at
    FROM access_requests
  ),
  users AS (
    SELECT lower(email) AS email_key, id AS user_id,
           name AS user_name, email,
           "createdAt" AS account_created_at
    FROM layout_user
  ),
  people AS (
    SELECT
      COALESCE(u.email_key, w.email_key)              AS email_key,
      COALESCE(NULLIF(u.user_name, ''), w.name)       AS name,
      COALESCE(u.email, w.email)                      AS email,
      (u.user_id IS NOT NULL)                         AS signed_up,
      w.waitlist_status, w.invite_code, w.waitlist_at,
      u.user_id, u.account_created_at
    FROM waitlist w
    FULL OUTER JOIN users u USING (email_key)
  ),
  projects AS (
    SELECT user_id, COUNT(*) AS layout_mds
    FROM layout_projects
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ),
  saved AS (
    SELECT created_by AS user_id, COUNT(*) AS saved_variants
    FROM layout_component
    WHERE created_by IS NOT NULL
    GROUP BY created_by
  ),
  generated AS (
    SELECT user_id, COUNT(*) AS generated_variants
    FROM layout_platform_event
    WHERE event = 'variant.generated' AND user_id IS NOT NULL
    GROUP BY user_id
  ),
  last_login AS (
    SELECT "userId" AS user_id, MAX("createdAt") AS last_login_at
    FROM layout_session
    GROUP BY "userId"
  )
  SELECT
    p.name,
    p.email,
    p.signed_up,
    p.waitlist_status,
    p.invite_code,
    p.waitlist_at,
    p.account_created_at,
    ll.last_login_at,
    COALESCE(pr.layout_mds, 0)        AS layout_mds,
    COALESCE(s.saved_variants, 0)     AS saved_variants,
    COALESCE(g.generated_variants, 0) AS generated_variants,
    COALESCE(pr.layout_mds, 0)
      + COALESCE(s.saved_variants, 0)
      + COALESCE(g.generated_variants, 0) AS total_activity
  FROM people p
  LEFT JOIN projects   pr ON pr.user_id = p.user_id
  LEFT JOIN saved      s  ON s.user_id  = p.user_id
  LEFT JOIN generated  g  ON g.user_id  = p.user_id
  LEFT JOIN last_login ll ON ll.user_id = p.user_id
  ORDER BY p.signed_up DESC, total_activity ASC, p.email
) TO STDOUT WITH CSV HEADER;
