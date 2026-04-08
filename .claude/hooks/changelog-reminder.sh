#!/bin/bash
# Stop hook: remind Claude to add changelog entries before finishing
# Blocks session end if feat:/fix: commits exist without changelog updates
# Changelog drafts are now stored in Supabase (layout_changelog_draft table)

# Check for feat: or fix: commits ahead of remote (unpushed work only)
# This avoids false positives from previous sessions' pushed commits
REMOTE_BRANCH=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || echo "origin/staging")
RECENT_FEAT_FIX=$(git log --oneline "$REMOTE_BRANCH"..HEAD --grep="^feat" --grep="^fix" --format="%H" 2>/dev/null)

if [ -z "$RECENT_FEAT_FIX" ]; then
  exit 0
fi

# Check if changelog draft.ts was modified (legacy) or CLAUDE.md mentions changelog was handled
DRAFT_TOUCHED=$(git log --oneline "$REMOTE_BRANCH"..HEAD -- content/changelog/draft.ts 2>/dev/null)
if [ -n "$DRAFT_TOUCHED" ]; then
  exit 0
fi

# Check unstaged/staged changes to draft.ts (legacy)
if git diff --name-only 2>/dev/null | grep -q "content/changelog/draft.ts"; then
  exit 0
fi
if git diff --staged --name-only 2>/dev/null | grep -q "content/changelog/draft.ts"; then
  exit 0
fi

# Check if any commit message mentions "changelog" (indicates entries were added via API)
CHANGELOG_MENTIONED=$(git log --oneline "$REMOTE_BRANCH"..HEAD --grep="changelog" --format="%H" 2>/dev/null)
if [ -n "$CHANGELOG_MENTIONED" ]; then
  exit 0
fi

# Block: user-facing changes without changelog entries
cat >&2 <<'EOF'
{"decision": "block", "reason": "This session has feat/fix commits but no changelog entries were added. Before finishing, add changelog entries via the admin API (PUT /api/admin/changelog) or the admin UI. Entries are stored in Supabase (layout_changelog_draft table), not draft.ts."}
EOF
exit 2
