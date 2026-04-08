---
description: Find untested files and generate tests for them
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
model: opus
---

# Find & Generate Missing Tests

Scan the codebase for files that export functions but have no test coverage, then offer to write tests.

## Phase 1: Scan for untested files

Run this scan to find source files without matching test files:

```bash
# Find all .ts files in lib/ and app/api/ that are NOT test files, type-only files, or index re-exports
# Then check which ones have a matching .test.ts file

echo "=== Scanning for untested files ==="
echo ""

UNTESTED=""
TESTED=""

# Scan lib/
for f in $(find lib -name "*.ts" -not -name "*.test.ts" -not -name "*.d.ts" -not -path "*/types/*" -not -name "index.ts" 2>/dev/null | sort); do
  testfile="${f%.ts}.test.ts"
  if [ -f "$testfile" ]; then
    TESTED="$TESTED\n  [covered] $f"
  else
    # Check file actually exports functions (not just types/interfaces)
    if grep -qE "^export (function|const|async function|default)" "$f" 2>/dev/null; then
      UNTESTED="$UNTESTED\n  [NO TEST] $f"
    fi
  fi
done

# Scan app/api/ routes
for f in $(find app/api -name "route.ts" 2>/dev/null | sort); do
  dir=$(dirname "$f")
  testfile="$dir/route.test.ts"
  if [ -f "$testfile" ]; then
    TESTED="$TESTED\n  [covered] $f"
  else
    UNTESTED="$UNTESTED\n  [NO TEST] $f"
  fi
done

echo "ALREADY TESTED:"
echo -e "$TESTED"
echo ""
echo "MISSING TESTS:"
echo -e "$UNTESTED"
echo ""
echo "$(echo -e "$UNTESTED" | grep -c "NO TEST") files without tests"
echo "$(echo -e "$TESTED" | grep -c "covered") files with tests"
```

## Phase 2: Ask what to test

Show the untested files to the user and ask which they want tests for.

Use AskUserQuestion:
- Show the list of untested files grouped by area (lib/tokens, lib/health, lib/figma, lib/integrations, app/api, etc.)
- Options: "All of them", "Let me pick", "Just the new ones" (files modified in last 5 commits)
- If "Let me pick", show checkboxes for each file

## Phase 3: Write the tests

For each selected file:

1. **Read the source file** to understand exports, function signatures, dependencies
2. **Read 1-2 existing test files** in the same area to match patterns (import style, mock approach)
3. **Write the test file** colocated next to the source (e.g. `lib/foo/bar.test.ts`)

### Test writing rules (Layout Studio conventions)

- Use `import { describe, it, expect, vi } from 'vitest'`
- Use `@/` path alias for imports from other directories
- Use relative imports for the file being tested (e.g. `./storybook`)
- Mock modules with side effects using `vi.mock()` at top level
- Mock `server-only` is handled by vitest.config.ts alias
- Mock `@/lib/auth`, `next/headers`, Supabase, etc. when testing server code
- Pure functions (no I/O, no auth) need no mocking
- For async functions that do DNS/filesystem, mock the specific Node API
- Test files use `.test.ts` extension (not `.spec.ts`)
- Descriptive test names: `it("returns null when token not found")`

### What to test per file type

**Pure utility functions (lib/tokens, lib/health, lib/export):**
- Happy path with typical input
- Edge cases: empty input, null, boundary values
- Error conditions

**Functions with I/O (lib/figma, lib/website, lib/integrations):**
- Mock the I/O layer (fetch, fs, dns)
- Test the parsing/logic with fixture data
- Test error handling (network failure, invalid response)

**API routes (app/api):**
- 401 without auth
- 400 with invalid body
- 200 with valid input
- Mock auth and database

## Phase 4: Run and verify

```bash
npx vitest run
```

Show a summary of what was created and the test count.
