#!/usr/bin/env bash
# Run the user activity report against production Supabase and save CSV locally.
# Read-only. Output contains PII (names + emails) — do not commit.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="$HERE/output"
mkdir -p "$OUT_DIR"

STAMP=$(date +%Y-%m-%d)
OUT="$OUT_DIR/user-activity-$STAMP.csv"

SSH_HOST="root@94.130.130.22"
PROD_CONTAINER="supabase-db-w1rasv0wm54ab3vv0tieobxi"

echo "→ Running report against production ($PROD_CONTAINER)…"
ssh "$SSH_HOST" "docker exec -i $PROD_CONTAINER psql -U postgres -d postgres -q" \
  < "$HERE/user-activity.sql" \
  > "$OUT"

LINES=$(wc -l < "$OUT" | tr -d ' ')
ROWS=$(( LINES - 1 ))
echo "✓ Wrote $ROWS rows (+1 header) to $OUT"
