# Figma Variables Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bidirectional sync between Layout token storage and Figma Variables — pull Layout tokens into Figma, push Figma Variables to Layout.

**Architecture:** New Variables tab in the Figma plugin with source toggle (From Layout / From Figma). Pull flow: fetch tokens via new `GET /api/plugin/tokens`, compute diff, show green/amber/red diff UI, write accepted changes via `figma.variables.*`. Push flow: read Figma Variables, POST to new `POST /api/plugin/tokens/import`. Both flows use existing `requireMcpAuth` for API key auth.

**Tech Stack:** Next.js App Router (server), React + esbuild (plugin), `figma.variables.*` Plugin API, existing `bulkUpsertTokens` / `getTokensByOrg` from `lib/supabase/tokens.ts`.

**Repos:**
- Studio app: `/Users/matt/Cursor Projects/Superduper AI Studio`
- Figma plugin: `/Users/matt/Cursor Projects/layout figma plugin/superduperui-figma`

---

### Task 1: Server — GET /api/plugin/tokens

**Files:**
- Create: `app/api/plugin/tokens/route.ts`

Fetch the org's tokens (optionally scoped by `projectId` query param) and return them in plugin-friendly format grouped by type.

**Step 1: Create the route**

```ts
// app/api/plugin/tokens/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMcpAuth } from "@/lib/api/mcp-auth";
import { getTokensByOrg } from "@/lib/supabase/tokens";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

const QuerySchema = z.object({
  projectId: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const auth = await requireMcpAuth(request, "read");
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    projectId: url.searchParams.get("projectId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400, headers: CORS });
  }

  const tokens = await getTokensByOrg(auth.orgId);

  const byType: Record<string, Array<{ name: string; value: string; cssVariable: string | null }>> = {};
  for (const t of tokens) {
    if (!byType[t.type]) byType[t.type] = [];
    byType[t.type].push({ name: t.name, value: t.value, cssVariable: t.cssVariable });
  }

  return NextResponse.json({ tokens: byType }, { headers: CORS });
}
```

**Step 2: Commit**

```bash
cd "/Users/matt/Cursor Projects/Superduper AI Studio"
git add app/api/plugin/tokens/route.ts
git commit -m "feat: add GET /api/plugin/tokens endpoint for Figma plugin"
```

---

### Task 2: Server — POST /api/plugin/tokens/import

**Files:**
- Modify: `app/api/plugin/tokens/route.ts`

Add the POST handler to the same file. Accepts Figma Variables in plugin format, upserts into Layout token storage.

**Step 1: Add POST handler**

Append to `app/api/plugin/tokens/route.ts`:

```ts
const ImportSchema = z.object({
  tokens: z.record(
    z.array(z.object({
      name: z.string(),
      value: z.string(),
      cssVariable: z.string().optional(),
    }))
  ),
});

export async function POST(request: Request) {
  const auth = await requireMcpAuth(request, "write");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const parsed = ImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400, headers: CORS }
    );
  }

  // Flatten all token categories into bulkUpsert input
  const rows: Parameters<typeof bulkUpsertTokens>[2] = [];
  for (const [type, entries] of Object.entries(parsed.data.tokens)) {
    for (const entry of entries) {
      rows.push({
        name: entry.name,
        value: entry.value,
        type: type as import("@/lib/types/token").DesignTokenType,
        cssVariable: entry.cssVariable,
        source: "figma",
        groupName: type,
      });
    }
  }

  // Need a projectId — use the most recent project for this org
  const { fetchAllProjects } = await import("@/lib/supabase/db");
  const projects = await fetchAllProjects(auth.orgId);
  if (!projects.length) {
    return NextResponse.json({ error: "No projects found" }, { status: 404, headers: CORS });
  }

  const { bulkUpsertTokens } = await import("@/lib/supabase/tokens");
  const result = await bulkUpsertTokens(auth.orgId, projects[0].id, rows);

  return NextResponse.json(result, { headers: CORS });
}
```

Also add the missing imports at the top of the file:
```ts
import { bulkUpsertTokens } from "@/lib/supabase/tokens";
import { fetchAllProjects } from "@/lib/supabase/db";
```

**Step 2: Commit**

```bash
git add app/api/plugin/tokens/route.ts
git commit -m "feat: add POST /api/plugin/tokens/import endpoint"
```

---

### Task 3: Server — Push to GitHub and deploy

**Step 1: Push**

```bash
cd "/Users/matt/Cursor Projects/Superduper AI Studio"
git push
```

Wait for Coolify to deploy before testing the plugin end-to-end.

---

### Task 4: Plugin — token-diff.ts

**Files:**
- Create: `src/lib/token-diff.ts` (Figma plugin repo)

Pure diff function — no Figma dependencies, easy to reason about.

**Step 1: Create the file**

```ts
// src/lib/token-diff.ts

export interface TokenEntry {
  name: string;
  value: string;
  cssVariable?: string | null;
}

export type DiffStatus = "added" | "changed" | "deleted" | "unchanged";

export interface DiffItem {
  name: string;
  status: DiffStatus;
  incomingValue?: string;
  existingValue?: string;
  cssVariable?: string | null;
}

/**
 * Compute diff between existing Figma variables and incoming Layout tokens.
 * existing: current variables in the "Layout" Figma collection
 * incoming: tokens fetched from Layout server
 */
export function computeDiff(
  existing: TokenEntry[],
  incoming: TokenEntry[]
): DiffItem[] {
  const existingMap = new Map(existing.map((t) => [t.name, t]));
  const incomingMap = new Map(incoming.map((t) => [t.name, t]));
  const result: DiffItem[] = [];

  // Added + changed
  for (const token of incoming) {
    const ex = existingMap.get(token.name);
    if (!ex) {
      result.push({ name: token.name, status: "added", incomingValue: token.value, cssVariable: token.cssVariable });
    } else if (ex.value !== token.value) {
      result.push({ name: token.name, status: "changed", incomingValue: token.value, existingValue: ex.value, cssVariable: token.cssVariable });
    } else {
      result.push({ name: token.name, status: "unchanged", incomingValue: token.value, cssVariable: token.cssVariable });
    }
  }

  // Deleted (in Figma, not in Layout)
  for (const token of existing) {
    if (!incomingMap.has(token.name)) {
      result.push({ name: token.name, status: "deleted", existingValue: token.value });
    }
  }

  return result;
}

/** Filter diff to only items that need action (excludes unchanged) */
export function actionableItems(diff: DiffItem[]): DiffItem[] {
  return diff.filter((d) => d.status !== "unchanged");
}

/** Default selection: accept added+changed, reject deleted */
export function defaultAccepted(diff: DiffItem[]): Set<string> {
  return new Set(
    diff.filter((d) => d.status === "added" || d.status === "changed").map((d) => d.name)
  );
}
```

**Step 2: Commit**

```bash
cd "/Users/matt/Cursor Projects/layout figma plugin/superduperui-figma"
git add src/lib/token-diff.ts
git commit -m "feat: add token diff utility for variables sync"
```

---

### Task 5: Plugin — figma-variables.ts

**Files:**
- Create: `src/lib/figma-variables.ts` (runs in code.ts main thread, has access to figma.*)

**Step 1: Create the file**

```ts
// src/lib/figma-variables.ts
import type { TokenEntry } from "./token-diff";

const COLLECTION_NAME = "Layout";
const MODE_NAME = "Default";

/** Read all variables from the "Layout" collection, or return [] if none. */
export function readLayoutVariables(): TokenEntry[] {
  const collections = figma.variables.getLocalVariableCollections();
  const collection = collections.find((c) => c.name === COLLECTION_NAME);
  if (!collection) return [];

  const modeId = collection.modes[0]?.modeId;
  if (!modeId) return [];

  return collection.variableIds
    .map((id) => figma.variables.getVariableById(id))
    .filter((v): v is Variable => v !== null)
    .map((v) => ({
      name: v.name,
      value: resolveValue(v, modeId),
      cssVariable: null,
    }));
}

function resolveValue(variable: Variable, modeId: string): string {
  const raw = variable.valuesByMode[modeId];
  if (raw === undefined) return "";
  if (variable.resolvedType === "COLOR") {
    const c = raw as RGBA;
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);
    const a = c.a ?? 1;
    return a < 1
      ? `rgba(${r},${g},${b},${a.toFixed(2)})`
      : `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  }
  return String(raw);
}

/** Get or create the "Layout" variable collection. */
function getOrCreateCollection(): VariableCollection {
  const existing = figma.variables.getLocalVariableCollections()
    .find((c) => c.name === COLLECTION_NAME);
  if (existing) return existing;

  const collection = figma.variables.createVariableCollection(COLLECTION_NAME);
  collection.renameMode(collection.modes[0].modeId, MODE_NAME);
  return collection;
}

/** Write accepted token entries into the "Layout" Figma Variables collection. */
export function writeLayoutVariables(tokens: TokenEntry[]): { written: number; errors: string[] } {
  const collection = getOrCreateCollection();
  const modeId = collection.modes[0].modeId;
  const errors: string[] = [];
  let written = 0;

  // Index existing variables by name for update-in-place
  const existing = new Map<string, Variable>();
  for (const id of collection.variableIds) {
    const v = figma.variables.getVariableById(id);
    if (v) existing.set(v.name, v);
  }

  for (const token of tokens) {
    try {
      const resolvedType = inferType(token.value);
      let variable = existing.get(token.name);

      if (!variable) {
        variable = figma.variables.createVariable(token.name, collection, resolvedType);
      }

      const value = parseValue(token.value, resolvedType);
      variable.setValueForMode(modeId, value);
      written++;
    } catch (err) {
      errors.push(`${token.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { written, errors };
}

/** Delete named variables from the "Layout" collection. */
export function deleteLayoutVariables(names: string[]): void {
  const collections = figma.variables.getLocalVariableCollections();
  const collection = collections.find((c) => c.name === COLLECTION_NAME);
  if (!collection) return;

  for (const id of collection.variableIds) {
    const v = figma.variables.getVariableById(id);
    if (v && names.includes(v.name)) {
      v.remove();
    }
  }
}

function inferType(value: string): VariableResolvedDataType {
  const trimmed = value.trim();
  if (trimmed.startsWith("#") || trimmed.startsWith("rgb")) return "COLOR";
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return "FLOAT";
  return "STRING";
}

function parseValue(value: string, type: VariableResolvedDataType): VariableValue {
  if (type === "COLOR") return hexToRgba(value);
  if (type === "FLOAT") return parseFloat(value);
  return value;
}

function hexToRgba(value: string): RGBA {
  const trimmed = value.trim();
  // Handle rgba(r,g,b,a)
  const rgbaMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]) / 255,
      g: parseInt(rgbaMatch[2]) / 255,
      b: parseInt(rgbaMatch[3]) / 255,
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1,
    };
  }
  // Handle #rrggbb
  const hex = trimmed.replace("#", "");
  return {
    r: parseInt(hex.slice(0, 2), 16) / 255,
    g: parseInt(hex.slice(2, 4), 16) / 255,
    b: parseInt(hex.slice(4, 6), 16) / 255,
    a: 1,
  };
}

/** Read ALL Figma Variables from the file (for push to Layout). */
export function readAllFigmaVariables(): Record<string, TokenEntry[]> {
  const collections = figma.variables.getLocalVariableCollections();
  const result: Record<string, TokenEntry[]> = {};

  for (const collection of collections) {
    const modeId = collection.modes[0]?.modeId;
    if (!modeId) continue;

    for (const id of collection.variableIds) {
      const v = figma.variables.getVariableById(id);
      if (!v) continue;

      const type = figmaTypeToLayoutType(v.resolvedType);
      if (!result[type]) result[type] = [];

      result[type].push({
        name: v.name,
        value: resolveValue(v, modeId),
        cssVariable: null,
      });
    }
  }

  return result;
}

function figmaTypeToLayoutType(type: VariableResolvedDataType): string {
  switch (type) {
    case "COLOR": return "color";
    case "FLOAT": return "spacing"; // best guess; user can reorganise in Layout
    case "STRING": return "typography";
    default: return "spacing";
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/figma-variables.ts
git commit -m "feat: add figma-variables.ts read/write utilities"
```

---

### Task 6: Plugin — Update api/client.ts

**Files:**
- Modify: `src/api/client.ts`

Add `getTokens()` and `importTokens()` methods to `LayoutApiClient`.

**Step 1: Add methods**

Inside the `LayoutApiClient` class in `src/api/client.ts`, add after `getSyncStatus`:

```ts
/** Fetch tokens from Layout for this org */
async getTokens(projectId?: string): Promise<Record<string, Array<{ name: string; value: string; cssVariable: string | null }>>> {
  const path = projectId
    ? `/api/plugin/tokens?projectId=${encodeURIComponent(projectId)}`
    : "/api/plugin/tokens";
  const result = await this.request<{ tokens: Record<string, Array<{ name: string; value: string; cssVariable: string | null }>> }>(path);
  return result.tokens;
}

/** Import Figma variables into Layout token storage */
async importTokens(
  tokens: Record<string, Array<{ name: string; value: string; cssVariable?: string }>>
): Promise<{ created: number; updated: number; unchanged: number }> {
  return this.request("/api/plugin/tokens", {
    method: "POST",
    body: JSON.stringify({ tokens }),
  });
}
```

**Step 2: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add getTokens and importTokens to LayoutApiClient"
```

---

### Task 7: Plugin — code.ts message handlers

**Files:**
- Modify: `src/code.ts`

Add three new message types to `figma.ui.onmessage`.

**Step 1: Add imports at top of code.ts**

```ts
import { readLayoutVariables, writeLayoutVariables, deleteLayoutVariables, readAllFigmaVariables } from "./lib/figma-variables";
```

**Step 2: Add cases to the switch statement** (after `"verify-api-key"` case):

```ts
case "read-figma-variables":
  figma.ui.postMessage({
    type: "figma-variables-result",
    payload: { variables: readLayoutVariables() },
  });
  break;

case "write-figma-variables": {
  const accepted = (msg.payload?.accepted as Array<{ name: string; value: string; cssVariable?: string }>) ?? [];
  const toDelete = (msg.payload?.toDelete as string[]) ?? [];
  if (toDelete.length > 0) deleteLayoutVariables(toDelete);
  const result = writeLayoutVariables(accepted);
  figma.ui.postMessage({ type: "variables-written", payload: result });
  break;
}

case "read-all-figma-variables":
  figma.ui.postMessage({
    type: "all-figma-variables-result",
    payload: { variables: readAllFigmaVariables() },
  });
  break;
```

**Step 3: Commit**

```bash
git add src/code.ts
git commit -m "feat: add variables message handlers to code.ts"
```

---

### Task 8: Plugin — VariablesPanel.tsx

**Files:**
- Create: `src/panels/VariablesPanel.tsx`

**Step 1: Create the panel**

```tsx
// src/panels/VariablesPanel.tsx
import React, { useState, useCallback, useEffect } from "react";
import { LayoutApiClient } from "../api/client";
import { computeDiff, actionableItems, defaultAccepted } from "../lib/token-diff";
import type { DiffItem } from "../lib/token-diff";

interface VariablesPanelProps {
  apiKey: string | null;
  baseUrl: string;
}

type Source = "layout" | "figma";
type PanelState = "idle" | "loading" | "diff" | "pushing" | "done" | "error";

export function VariablesPanel({ apiKey, baseUrl }: VariablesPanelProps) {
  const [source, setSource] = useState<Source>("layout");
  const [state, setState] = useState<PanelState>("idle");
  const [diff, setDiff] = useState<DiffItem[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Listen for messages from code.ts
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data?.pluginMessage;
      if (!msg) return;

      if (msg.type === "figma-variables-result" && state === "loading") {
        const existingVars: Array<{ name: string; value: string }> = msg.payload.variables;
        // We'll have already fetched Layout tokens by now — stored in ref
        // This is called after fetchLayoutTokens sets pendingLayoutTokens
      }

      if (msg.type === "variables-written") {
        const { written, errors } = msg.payload as { written: number; errors: string[] };
        if (errors.length > 0) {
          setErrorMsg(`Written ${written} variables. Errors: ${errors.join("; ")}`);
          setState("error");
        } else {
          setResultMsg(`${written} variables synced to Figma`);
          setState("done");
        }
      }

      if (msg.type === "all-figma-variables-result" && state === "loading") {
        // Push flow: received all Figma variables, now push to Layout
        const variables: Record<string, Array<{ name: string; value: string }>> = msg.payload.variables;
        pushToLayout(variables);
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFetchAndDiff = useCallback(async () => {
    if (!apiKey) return;
    setState("loading");
    setErrorMsg(null);

    try {
      // 1. Fetch Layout tokens
      const client = new LayoutApiClient(baseUrl, apiKey);
      const layoutTokens = await client.getTokens();

      // 2. Read existing Figma Layout variables
      const existing: Array<{ name: string; value: string }> = await new Promise((resolve) => {
        const handler = (event: MessageEvent) => {
          if (event.data?.pluginMessage?.type === "figma-variables-result") {
            window.removeEventListener("message", handler);
            resolve(event.data.pluginMessage.payload.variables);
          }
        };
        window.addEventListener("message", handler);
        parent.postMessage({ pluginMessage: { type: "read-figma-variables" } }, "*");
      });

      // 3. Flatten Layout tokens to array
      const incoming = Object.values(layoutTokens).flat();

      // 4. Compute diff
      const diffResult = computeDiff(existing, incoming);
      const actionable = actionableItems(diffResult);

      setDiff(actionable);
      setAccepted(defaultAccepted(actionable));
      setState("diff");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to fetch tokens");
      setState("error");
    }
  }, [apiKey, baseUrl]);

  const handleApply = useCallback(() => {
    setState("pushing");
    const toWrite = diff
      .filter((d) => accepted.has(d.name) && d.status !== "deleted")
      .map((d) => ({ name: d.name, value: d.incomingValue!, cssVariable: d.cssVariable ?? undefined }));
    const toDelete = diff
      .filter((d) => accepted.has(d.name) && d.status === "deleted")
      .map((d) => d.name);

    parent.postMessage({
      pluginMessage: { type: "write-figma-variables", payload: { accepted: toWrite, toDelete } },
    }, "*");
  }, [diff, accepted]);

  const handlePushToLayout = useCallback(() => {
    if (!apiKey) return;
    setState("loading");
    setErrorMsg(null);
    parent.postMessage({ pluginMessage: { type: "read-all-figma-variables" } }, "*");
  }, [apiKey]);

  const pushToLayout = useCallback(async (variables: Record<string, Array<{ name: string; value: string }>>) => {
    if (!apiKey) return;
    try {
      const client = new LayoutApiClient(baseUrl, apiKey);
      const result = await client.importTokens(variables);
      setResultMsg(`Pushed to Layout: ${result.created} created, ${result.updated} updated, ${result.unchanged} unchanged`);
      setState("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Push failed");
      setState("error");
    }
  }, [apiKey, baseUrl]);

  if (!apiKey) {
    return (
      <div style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", opacity: 0.6 }}>
          Connect your Layout API key in Settings first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <h3 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>Variables Sync</h3>
      <p style={{ fontSize: "11px", opacity: 0.7, margin: "0 0 16px" }}>
        Sync design tokens between Layout and Figma Variables.
      </p>

      {/* Source toggle */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
        {(["layout", "figma"] as Source[]).map((s) => (
          <button
            key={s}
            onClick={() => { setSource(s); setState("idle"); setDiff([]); setResultMsg(null); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: "6px",
              fontSize: "11px",
              fontWeight: source === s ? 600 : 400,
              background: source === s ? "var(--figma-color-bg-brand)" : "var(--figma-color-bg-secondary)",
              color: source === s ? "var(--figma-color-text-onbrand)" : "var(--figma-color-text)",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            {s === "layout" ? "← From Layout" : "→ To Layout"}
          </button>
        ))}
      </div>

      {/* Action */}
      {state === "idle" && (
        <button
          onClick={source === "layout" ? handleFetchAndDiff : handlePushToLayout}
          style={btnStyle(false)}
        >
          {source === "layout" ? "Fetch & Preview Changes" : "Push Figma Variables to Layout"}
        </button>
      )}

      {state === "loading" && (
        <p style={{ fontSize: "11px", opacity: 0.6 }}>Loading...</p>
      )}

      {/* Diff view */}
      {state === "diff" && diff.length === 0 && (
        <p style={{ fontSize: "11px", opacity: 0.6 }}>Everything is up to date.</p>
      )}

      {state === "diff" && diff.length > 0 && (
        <>
          <div style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
            <button onClick={() => setAccepted(new Set(diff.map((d) => d.name)))} style={smallBtnStyle}>Accept all</button>
            <button onClick={() => setAccepted(new Set())} style={smallBtnStyle}>Skip all</button>
          </div>

          <div style={{ border: "1px solid var(--figma-color-border)", borderRadius: "6px", overflow: "hidden", marginBottom: "12px" }}>
            {diff.map((item) => (
              <div
                key={item.name}
                onClick={() => {
                  const next = new Set(accepted);
                  if (next.has(item.name)) next.delete(item.name);
                  else next.add(item.name);
                  setAccepted(next);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px",
                  borderBottom: "1px solid var(--figma-color-border)",
                  cursor: "pointer",
                  background: accepted.has(item.name) ? statusBg(item.status) : "transparent",
                  opacity: accepted.has(item.name) ? 1 : 0.4,
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 600, color: statusColour(item.status), minWidth: "52px" }}>
                  {item.status.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", flex: 1, fontFamily: "monospace" }}>{item.name}</span>
                <span style={{ fontSize: "10px", opacity: 0.6, fontFamily: "monospace" }}>
                  {item.incomingValue ?? item.existingValue}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handleApply} disabled={accepted.size === 0} style={btnStyle(accepted.size === 0)}>
            Apply {accepted.size} change{accepted.size !== 1 ? "s" : ""}
          </button>
        </>
      )}

      {state === "pushing" && <p style={{ fontSize: "11px", opacity: 0.6 }}>Applying...</p>}

      {state === "done" && resultMsg && (
        <div style={{ padding: "10px 12px", borderRadius: "6px", background: "var(--figma-color-bg-success)", fontSize: "11px", marginBottom: "8px" }}>
          {resultMsg}
        </div>
      )}

      {(state === "done" || state === "error") && (
        <button onClick={() => { setState("idle"); setDiff([]); setResultMsg(null); setErrorMsg(null); }} style={btnStyle(false)}>
          Reset
        </button>
      )}

      {errorMsg && (
        <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--figma-color-bg-danger)", fontSize: "11px", marginTop: "8px" }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}

const btnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "10px",
  fontSize: "12px",
  fontWeight: 600,
  background: disabled ? "var(--figma-color-bg-disabled)" : "var(--figma-color-bg-brand)",
  color: "var(--figma-color-text-onbrand)",
  border: "none",
  borderRadius: "6px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
});

const smallBtnStyle: React.CSSProperties = {
  padding: "4px 10px",
  fontSize: "10px",
  background: "var(--figma-color-bg-secondary)",
  color: "var(--figma-color-text)",
  border: "1px solid var(--figma-color-border)",
  borderRadius: "4px",
  cursor: "pointer",
};

function statusBg(status: DiffItem["status"]): string {
  switch (status) {
    case "added": return "rgba(40,167,69,0.12)";
    case "changed": return "rgba(255,193,7,0.12)";
    case "deleted": return "rgba(220,53,69,0.12)";
    default: return "transparent";
  }
}

function statusColour(status: DiffItem["status"]): string {
  switch (status) {
    case "added": return "#28a745";
    case "changed": return "#e6a817";
    case "deleted": return "#dc3545";
    default: return "inherit";
  }
}
```

**Step 2: Commit**

```bash
git add src/panels/VariablesPanel.tsx
git commit -m "feat: add VariablesPanel for bidirectional token sync"
```

---

### Task 9: Plugin — Wire up ui.tsx

**Files:**
- Modify: `src/ui.tsx`

**Step 1: Add import**

```ts
import { VariablesPanel } from "./panels/VariablesPanel";
```

**Step 2: Add "variables" to TABS array** (after "canvas"):

```ts
{ id: "variables", label: "Variables" },
```

**Step 3: Update TabId type**:

```ts
type TabId = "export" | "inspector" | "health" | "canvas" | "variables" | "settings";
```

**Step 4: Add panel render** (after `canvas` block, before `settings` block):

```tsx
{activeTab === "variables" && (
  <VariablesPanel
    apiKey={apiKey}
    baseUrl={baseUrl}
  />
)}
```

**Step 5: Commit**

```bash
git add src/ui.tsx
git commit -m "feat: add Variables tab to plugin UI"
```

---

### Task 10: Build and test

**Step 1: Build plugin**

```bash
cd "/Users/matt/Cursor Projects/layout figma plugin/superduperui-figma"
npm run build
```

Expected: no errors, `dist/code.js` and `dist/ui.html` updated.

**Step 2: Typecheck**

```bash
npm run typecheck
```

Fix any type errors before continuing.

**Step 3: Reload plugin in Figma**

In Figma: right-click plugin → "Reload plugin". Or close and reimport from manifest.

**Step 4: Manual test — Pull flow**

1. Open Variables tab
2. Ensure "← From Layout" is selected
3. Click "Fetch & Preview Changes"
4. Verify diff shows correctly (added in green, changed in amber, deleted in red)
5. Click "Accept all" then "Apply N changes"
6. Open Figma's local variables panel — verify "Layout" collection was created/updated

**Step 5: Manual test — Push flow**

1. Create a few manual Figma variables in a test collection
2. Switch to "→ To Layout"
3. Click "Push Figma Variables to Layout"
4. Navigate to Layout Studio → Tokens page — verify tokens appeared

**Step 6: Commit plugin dist**

```bash
git add dist/
git commit -m "build: rebuild plugin with variables sync"
```

---

### Notes

- The `figma.variables.*` API is available on all Figma plans for local variables (not published library variables)
- If a token value can't be parsed as COLOR or FLOAT, it falls back to STRING
- The "Layout" collection is never deleted even if all variables are removed — this is intentional to preserve the collection's variable references in designs
