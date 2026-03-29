#!/bin/bash
# Stop hook: remind Claude to add changelog entries before finishing
# Blocks session end if feat:/fix: commits exist without draft.ts changes

# Check for feat: or fix: commits in the last 2 hours
RECENT_FEAT_FIX=$(git log --oneline --since="2 hours ago" --grep="^feat" --grep="^fix" --format="%H" 2>/dev/null)

if [ -z "$RECENT_FEAT_FIX" ]; then
  exit 0
fi

# Check if draft.ts was modified in recent commits
DRAFT_TOUCHED=$(git log --oneline --since="2 hours ago" -- content/changelog/draft.ts 2>/dev/null)
if [ -n "$DRAFT_TOUCHED" ]; then
  exit 0
fi

# Check unstaged or staged changes to draft.ts
if git diff --name-only 2>/dev/null | grep -q "content/changelog/draft.ts"; then
  exit 0
fi
if git diff --staged --name-only 2>/dev/null | grep -q "content/changelog/draft.ts"; then
  exit 0
fi

# Block: user-facing changes without changelog entries
cat >&2 <<'EOF'
{"decision": "block", "reason": "This session has feat/fix commits but no changelog entries were added. Before finishing, add entries to content/changelog/draft.ts for any user-facing changes. Use the ChangelogEntry format with id, title, description, product, category, and date fields."}
EOF
exit 2
