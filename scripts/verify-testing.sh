#!/bin/bash
# verify-testing.sh — Auto-verify TESTING.md items that have automated test suites.
# Reads unchecked items with test: tags, runs matching Vitest suites, and checks off passing items.
#
# Usage:
#   bash scripts/verify-testing.sh          # Run all tagged tests and auto-check passing items
#   bash scripts/verify-testing.sh --dry    # Show what would be tested without running

set -euo pipefail

TESTING_FILE="/Users/matt/Cursor Projects/Layout/TESTING.md"
STUDIO_DIR="/Users/matt/Cursor Projects/Layout/layout-studio"
DRY_RUN=false

if [ "${1:-}" = "--dry" ]; then
  DRY_RUN=true
fi

if [ ! -f "$TESTING_FILE" ]; then
  echo "No TESTING.md found at $TESTING_FILE"
  exit 0
fi

# Tag-to-Vitest-pattern mapping (portable, no associative arrays)
get_pattern() {
  case "$1" in
    test:extraction) echo "lib/figma/**/*.test.ts app/api/extract/**/*.test.ts" ;;
    test:tokens)     echo "lib/tokens/**/*.test.ts" ;;
    test:export)     echo "lib/export/**/*.test.ts app/api/export/**/*.test.ts" ;;
    test:auth)       echo "lib/api/auth-context.test.ts" ;;
    test:health)     echo "lib/health/**/*.test.ts" ;;
    test:webhooks)   echo "app/api/webhooks/**/*.test.ts" ;;
    test:rate-limit) echo "lib/rate-limit.test.ts" ;;
    test:explorer)   echo "lib/explore/**/*.test.ts app/api/generate/explore/**/*.test.ts" ;;
    test:diff)       echo "lib/extraction/diff.test.ts" ;;
    *)               echo "" ;;
  esac
}

# Collect unique test tags from unchecked items
TAGS_TO_RUN=""
while IFS= read -r line; do
  if echo "$line" | grep -qE '^\s*- \[ \].*<!-- [a-f0-9]+ test:'; then
    TAG=$(echo "$line" | sed -n 's/.*<!-- [a-f0-9]* \(test:[a-z-]*\) -->.*/\1/p')
    if [ -n "$TAG" ]; then
      if ! echo "$TAGS_TO_RUN" | grep -qw "$TAG"; then
        TAGS_TO_RUN="$TAGS_TO_RUN $TAG"
      fi
    fi
  fi
done < "$TESTING_FILE"

# Trim leading space
TAGS_TO_RUN=$(echo "$TAGS_TO_RUN" | sed 's/^ //')

if [ -z "$TAGS_TO_RUN" ]; then
  echo "No unchecked items with test: tags found in TESTING.md"
  exit 0
fi

TAG_COUNT=$(echo "$TAGS_TO_RUN" | wc -w | tr -d ' ')
echo "Found $TAG_COUNT test tag(s) to verify: $TAGS_TO_RUN"
echo ""

# Track results
PASSED_TAGS=""
FAILED_TAGS=""
PASS_COUNT=0
FAIL_COUNT=0

for TAG in $TAGS_TO_RUN; do
  PATTERN=$(get_pattern "$TAG")
  if [ -z "$PATTERN" ]; then
    echo "  [?] $TAG — no test pattern mapped, skipping"
    continue
  fi

  if [ "$DRY_RUN" = true ]; then
    echo "  [dry] $TAG — would run: npx vitest run $PATTERN"
    continue
  fi

  echo "  Running $TAG..."
  # shellcheck disable=SC2086
  if (cd "$STUDIO_DIR" && npx vitest run $PATTERN --reporter=dot 2>&1 | tail -3); then
    PASSED_TAGS="$PASSED_TAGS $TAG"
    PASS_COUNT=$((PASS_COUNT + 1))
    echo "  [PASS] $TAG"
  else
    FAILED_TAGS="$FAILED_TAGS $TAG"
    FAIL_COUNT=$((FAIL_COUNT + 1))
    echo "  [FAIL] $TAG"
  fi
  echo ""
done

if [ "$DRY_RUN" = true ]; then
  echo "Dry run complete. No items were checked off."
  exit 0
fi

# Auto-check passing items in TESTING.md
CHECKED_COUNT=0
for TAG in $PASSED_TAGS; do
  # Check off unchecked lines with this tag
  BEFORE=$(grep -c '^\s*- \[ \]' "$TESTING_FILE" 2>/dev/null || echo "0")
  sed -i '' "s/^\(- \)\[ \]\(.*<!-- [a-f0-9]* ${TAG} -->.*\)/\1[x]\2 (auto-verified)/" "$TESTING_FILE" 2>/dev/null || true
  AFTER=$(grep -c '^\s*- \[ \]' "$TESTING_FILE" 2>/dev/null || echo "0")
  DIFF=$((BEFORE - AFTER))
  CHECKED_COUNT=$((CHECKED_COUNT + DIFF))
done

# Summary
TOTAL_UNCHECKED=$(grep -c '^\s*- \[ \]' "$TESTING_FILE" 2>/dev/null || echo "0")
echo "================================"
echo "Results:"
echo "  Passed: $PASS_COUNT tag(s)"
echo "  Failed: $FAIL_COUNT tag(s)"
echo "  Auto-verified: $CHECKED_COUNT item(s)"
echo "  Remaining manual: $TOTAL_UNCHECKED item(s)"
echo "================================"
