# Figma Variables Sync — Design

**Date:** 2026-03-15
**Status:** Approved

## Overview

Bidirectional sync between Figma Variables and Layout token storage. Users can push tokens from Layout into Figma Variables, or push Figma Variables up to Layout — from a dedicated Variables panel in the Figma plugin.

## User Flows

### Pull (Layout → Figma Variables)
1. User opens Variables panel, selects "From Layout" source
2. Plugin fetches tokens from Layout project via `GET /api/plugin/tokens?projectId=...`
3. Plugin shows a diff view: new (green), changed (amber), deleted (red)
4. User can accept all / skip all / accept individually
5. Plugin writes to `figma.variables.*` — creates "Layout" collection if absent, updates in place if present

### Push (Figma → Layout)
1. User opens Variables panel, selects "From Figma" source
2. Plugin reads all Figma Variables from `figma.variables.getLocalVariableCollections()`
3. Maps to Layout token format and POSTs to `POST /api/plugin/tokens/import`
4. Success state shows count of tokens synced + link to Layout project

## Architecture

### Plugin (new files)
- `src/panels/VariablesPanel.tsx` — UI: source toggle, diff view, action buttons
- `src/lib/figma-variables.ts` — read/write Figma Variables API (`figma.variables.*`)
- `src/lib/token-diff.ts` — diff engine comparing existing variables to incoming tokens

### Plugin (modified files)
- `src/ui.tsx` — add Variables tab
- `src/code.ts` — add message handlers: `read-figma-variables`, `write-figma-variables`
- `src/api/client.ts` — add `getTokens()` and `importTokens()` methods

### Studio server (new files)
- `app/api/plugin/tokens/route.ts` — `GET` returns project tokens in plugin format; `POST` imports tokens from plugin

## Token Type Mapping

| Layout category | Figma Variable type | Notes |
|---|---|---|
| colors | `COLOR` | RGBA values |
| spacing | `FLOAT` | px values |
| radius | `FLOAT` | px values |
| typography.fontSize | `FLOAT` | px values |
| typography.fontFamily | `STRING` | font family name |
| typography.fontWeight | `FLOAT` | numeric weight |

Typography compound styles are split into separate variables (e.g. `typography/heading-1/size`, `typography/heading-1/family`).

## Data Format

### GET /api/plugin/tokens response
```json
{
  "projectId": "abc123",
  "projectName": "My Design System",
  "tokens": {
    "colors": [{ "name": "primary", "value": "#6366f1", "cssVariable": "--color-primary" }],
    "spacing": [{ "name": "sm", "value": "8", "cssVariable": "--spacing-sm" }],
    "radius": [{ "name": "md", "value": "6", "cssVariable": "--radius-md" }],
    "typography": [{ "name": "heading-1", "fontSize": "32", "fontFamily": "Inter", "fontWeight": "700" }]
  }
}
```

### POST /api/plugin/tokens/import body
Same shape as GET response, plus `orgId` resolved from API key.

## Conflict Resolution

When pulling Layout → Figma:
- Diff is computed by variable name (exact match)
- New: in Layout, not in Figma → shown green, included by default
- Changed: in both, value differs → shown amber, included by default
- Deleted: in Figma collection, not in Layout → shown red, excluded by default

## Figma Variables Collection

- Collection name: **"Layout"**
- Single mode: **"Default"**
- Variables named using slash notation: `colors/primary`, `spacing/sm`, etc.
- Existing non-Layout collections are never touched

## Error Handling

- No Layout project linked → prompt to connect in Settings
- Figma Variables API unavailable (shouldn't happen on any plan for local variables) → show error
- Network failure during fetch → show retry button
- Partial write failure → report which variables failed, leave others in place

## Out of Scope (v1)

- Multiple modes (light/dark)
- Selective collection mapping (always uses "Layout" collection)
- Variable groups beyond slash notation
- Alias variables (references between variables)
