#!/bin/bash
# ===================================================================
# Ralph Autonomous Build Loop
# Project: Layout
# Generated: 2026-03-05
# ===================================================================

set -e

MAX_ITERATIONS=${1:-42}
ITERATION=0
BUILD_LOG="scripts/ralph/build-log.json"
TOTAL_STORIES=$(cat scripts/ralph/prd.json | jq '.userStories | length')

# Initialise build log if not exists
if [ ! -f "$BUILD_LOG" ]; then
    echo "{
  \"project\": \"layout-studio\",
  \"startedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"completedAt\": null,
  \"totalStories\": $TOTAL_STORIES,
  \"storiesCompleted\": 0,
  \"iterations\": 0,
  \"stories\": []
}" > "$BUILD_LOG"
fi

echo ""
echo "RALPH AUTONOMOUS BUILD"
echo "==================================================================="
echo "Project:    Layout"
echo "Iterations: $MAX_ITERATIONS max"
echo "Stories:    $TOTAL_STORIES total"
echo "Remaining:  $(cat scripts/ralph/prd.json | jq '[.userStories[] | select(.passes == false)] | length')"
echo "==================================================================="
echo ""

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))

    # Check completion
    REMAINING=$(cat scripts/ralph/prd.json | jq '[.userStories[] | select(.passes == false)] | length')

    if [ "$REMAINING" = "0" ]; then
        # Update build log completion
        jq --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
           --arg iterations "$ITERATION" \
           '.completedAt = $time | .iterations = ($iterations | tonumber)' \
           "$BUILD_LOG" > tmp.json && mv tmp.json "$BUILD_LOG"

        COMPLETED=$(jq '[.stories[] | select(.status == "completed")] | length' "$BUILD_LOG")

        echo ""
        echo "==================================================================="
        echo "ALL STORIES COMPLETE!"
        echo "-------------------------------------------------------------------"
        echo "  Stories:     $COMPLETED/$TOTAL_STORIES"
        echo "  Iterations:  $ITERATION"
        echo "==================================================================="
        echo ""
        echo "Build log: scripts/ralph/build-log.json"
        echo ""
        echo "Next steps:"
        echo "  1. Review: /review"
        echo "  2. Test thoroughly"
        echo "  3. Generate docs: /project-complete"
        echo "  4. Deploy: /deploy-check"
        echo ""
        exit 0
    fi

    echo "-------------------------------------------------------------------"
    echo "  Iteration $ITERATION/$MAX_ITERATIONS | Remaining: $REMAINING stories"
    echo "-------------------------------------------------------------------"

    # Run Claude with iteration prompt
    claude -p "$(cat scripts/ralph/prompt.md)"

    # Update iteration count in build log
    jq --arg iterations "$ITERATION" '.iterations = ($iterations | tonumber)' \
       "$BUILD_LOG" > tmp.json && mv tmp.json "$BUILD_LOG"

    sleep 2
done

echo ""
echo "==================================================================="
echo "MAX ITERATIONS REACHED ($MAX_ITERATIONS)"
echo "==================================================================="
REMAINING=$(cat scripts/ralph/prd.json | jq '[.userStories[] | select(.passes == false)] | length')
echo "Remaining stories: $REMAINING"
echo "Check build-log.json for story breakdown"
echo ""
echo "Options:"
echo "  ./scripts/ralph/ralph.sh 20    # Run 20 more iterations"
echo "  /implement [feature]           # Complete manually"
echo ""
