"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import type { Component, EditableElement, EditSchema, TokenProp } from "@/lib/types/component";
import type { ExtractedToken, TokenType } from "@/lib/types";
import {
  applyTextChange,
  applyTokenSwap,
  defaultVariantValues,
  isTokenProp,
  updateSchemaPropValue,
} from "@/lib/component-edits/apply";
import { useProjectStore } from "@/lib/store/project";
import { ComponentPreview } from "./ComponentPreview";
import { TokenPicker } from "./TokenPicker";
import { VariantToggle } from "./VariantToggle";

interface Props {
  projectId: string;
  linkedComponent: Component;
  /** Fired when the user clicks Save. Phase 4 wires this to PATCH. */
  onSave?: (next: { code: string; editSchema: EditSchema }) => Promise<void> | void;
  /** Fired when the user clicks Save as new variant. Phase 4 wires this. */
  onSaveAsNew?: (next: { code: string; editSchema: EditSchema }) => Promise<void> | void;
  /** Reports unsaved-edit state up so the drawer can warn before Regenerate. */
  onDirtyChange?: (dirty: boolean) => void;
}

/**
 * Form-driven editor for a generated component. Reads the editSchema, renders
 * one section per element with the appropriate input controls, and re-applies
 * deterministic edits to the TSX as the user changes values. Variant prop
 * changes are NOT mutations of the TSX — they're passed to the preview as
 * props instead, since the generated component is a function of those props.
 */
export function ComponentEditor({ projectId, linkedComponent, onSave, onSaveAsNew, onDirtyChange }: Props) {
  const initialSchema = linkedComponent.editSchema;
  const initialCode = linkedComponent.code;

  // Lazy initialisers so the default-value computation runs once on mount,
  // not on every render.
  const [schema, setSchema] = useState<EditSchema | null>(() => initialSchema);
  const [code, setCode] = useState(() => initialCode);
  const [variantValues, setVariantValues] = useState<Record<string, string>>(
    () => (initialSchema ? defaultVariantValues(initialSchema) : {})
  );

  // Reset local state when the underlying saved component changes (e.g.
  // after a Regenerate or after the drawer switches to a different
  // component). Without this, useState's initialiser only runs on mount
  // and the old code/schema would linger over the new linkedComponent.
  useEffect(() => {
    setSchema(linkedComponent.editSchema);
    setCode(linkedComponent.code);
    setVariantValues(
      linkedComponent.editSchema ? defaultVariantValues(linkedComponent.editSchema) : {}
    );
  }, [linkedComponent.id, linkedComponent.code, linkedComponent.editSchema]);

  // Select extractionData by reference (stable across renders unless the
  // project itself changes), then derive the flattened tokens via useMemo.
  // Returning a new array directly from the Zustand selector caused
  // ComponentEditor to render in a loop — every store subscription
  // notification produced a fresh reference, which any deps using `tokens`
  // would treat as new. (React error #185 reproduces from that path.)
  const extractionData = useProjectStore(
    (s) => s.projects.find((p) => p.id === projectId)?.extractionData
  );
  const tokens = useMemo<ExtractedToken[]>(() => {
    if (!extractionData) return [];
    return [
      ...extractionData.tokens.colors,
      ...extractionData.tokens.typography,
      ...extractionData.tokens.spacing,
      ...extractionData.tokens.radius,
      ...extractionData.tokens.effects,
    ];
  }, [extractionData]);

  const dirty = code !== linkedComponent.code;

  // Report dirty state up so the drawer can warn before a destructive
  // action like Regenerate.
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const reset = () => {
    setSchema(linkedComponent.editSchema);
    setCode(linkedComponent.code);
    setVariantValues(
      linkedComponent.editSchema ? defaultVariantValues(linkedComponent.editSchema) : {}
    );
  };

  if (!schema) {
    return (
      <div className="border-t border-[var(--studio-border)] px-5 py-4 text-[11px] text-[var(--text-muted)]">
        This component was generated before the form editor shipped.
        Regenerate to enable token pickers and live preview.
      </div>
    );
  }

  const handleTokenChange = (
    elementId: string,
    propKey: string,
    oldValue: string,
    newValue: string
  ) => {
    setSchema((s) => (s ? updateSchemaPropValue(s, elementId, propKey, newValue) : s));
    setCode((c) => applyTokenSwap(c, elementId, oldValue, newValue));
  };

  const handleTextChange = (elementId: string, propKey: string, newValue: string) => {
    setSchema((s) => (s ? updateSchemaPropValue(s, elementId, propKey, newValue) : s));
    setCode((c) => applyTextChange(c, elementId, newValue));
  };

  const handleVariantChange = (axis: string, value: string) => {
    setVariantValues((v) => ({ ...v, [axis]: value }));
  };

  // Refine via natural-language chat — for "make the corners smaller" /
  // "use the brand colour for the title" style fixes that the form pickers
  // can't reach (because they're not in the schema, or because the change
  // crosses multiple props). Server returns updated TSX + schema; user
  // previews and then Saves via the usual flow.
  const [refineInput, setRefineInput] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const submitRefine = async () => {
    if (!refineInput.trim() || refining) return;
    setRefining(true);
    setRefineError(null);
    try {
      // BYOK header — same pattern as Generate. With a key in Settings the
      // server uses it and skips credit deduction; without one the user's
      // hosted quota is charged 1 credit per refine call.
      const { getStoredApiKey } = await import("@/lib/hooks/use-api-key");
      const apiKey = getStoredApiKey();
      const res = await fetch(
        `/api/organizations/${linkedComponent.orgId}/components/${linkedComponent.id}/refine`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "X-Api-Key": apiKey } : {}),
          },
          body: JSON.stringify({ instruction: refineInput.trim() }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Refine failed (${res.status})`);
      }
      const result = (await res.json()) as { code: string; editSchema: EditSchema };
      setCode(result.code);
      setSchema(result.editSchema);
      setVariantValues(defaultVariantValues(result.editSchema));
      setRefineInput("");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Refine failed");
    } finally {
      setRefining(false);
    }
  };

  return (
    <div className="border-t border-[var(--studio-border)]">
      <div className="px-5 pt-4">
        <ComponentPreview
          projectId={projectId}
          code={code}
          variantValues={variantValues}
          className="mb-4"
        />
      </div>

      {schema.variants && Object.keys(schema.variants).length > 0 ? (
        <Section title="Variants">
          <div className="space-y-2">
            {Object.entries(schema.variants).map(([axis, options]) => (
              <VariantToggle
                key={axis}
                label={axis}
                value={variantValues[axis] ?? options[0] ?? ""}
                options={options}
                onChange={(v) => handleVariantChange(axis, v)}
              />
            ))}
          </div>
        </Section>
      ) : null}

      {schema.elements.map((el) => (
        <ElementSection
          key={el.id}
          element={el}
          tokens={tokens}
          onTokenChange={handleTokenChange}
          onTextChange={handleTextChange}
        />
      ))}

      {/*
        Natural-language refine — for things the form pickers can't reach.
        Examples: "make the corners smaller", "use the brand colour for the
        title", "remove the icon". Server returns updated TSX + schema and
        the user reviews via the preview before saving.
      */}
      <Section title="Refine with AI">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitRefine();
                }
              }}
              disabled={refining}
              placeholder="e.g. make the corners smaller, use the brand colour for the title"
              className="flex-1 rounded border border-[var(--studio-border)] bg-[var(--bg-app)] px-2 py-1.5 text-[11px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] disabled:opacity-50"
            />
            <button
              type="button"
              onClick={submitRefine}
              disabled={!refineInput.trim() || refining}
              className="inline-flex items-center gap-1.5 rounded bg-[var(--studio-accent)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-40"
            >
              {refining ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {refining ? "Refining…" : "Apply"}
            </button>
          </div>
          {refineError ? (
            <p className="text-[10px] text-[var(--color-error,#b3261e)]">{refineError}</p>
          ) : null}
          <p className="text-[10px] text-[var(--text-muted)]">
            Returns a new draft you can preview, then Save or Reset. Doesn&rsquo;t auto-commit.
          </p>
        </div>
      </Section>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--studio-border)] px-5 py-3">
        <button
          type="button"
          onClick={reset}
          disabled={!dirty}
          className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)] disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSaveAsNew?.({ code, editSchema: schema })}
            disabled={!onSaveAsNew}
            className="rounded border border-[var(--studio-border)] px-3 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-40"
          >
            Save as new variant
          </button>
          <button
            type="button"
            onClick={() => onSave?.({ code, editSchema: schema })}
            disabled={!onSave || !dirty}
            className="rounded bg-[var(--studio-accent)] px-3 py-1 text-[11px] font-medium text-[var(--text-on-accent)] transition-colors hover:bg-[var(--studio-accent-hover)] disabled:opacity-40"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--studio-border)] px-5 py-4">
      <h3 className="mb-3 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ElementSection({
  element,
  tokens,
  onTokenChange,
  onTextChange,
}: {
  element: EditableElement;
  tokens: ExtractedToken[];
  onTokenChange: (elementId: string, propKey: string, oldValue: string, newValue: string) => void;
  onTextChange: (elementId: string, propKey: string, newValue: string) => void;
}) {
  return (
    <Section title={element.label}>
      <div className="space-y-2">
        {element.props.map((prop) => {
          if (isTokenProp(prop)) {
            return (
              <TokenPicker
                key={`${element.id}:${prop.key}`}
                label={prop.key}
                value={prop.value}
                category={tokenCategory(prop)}
                tokens={tokens}
                onChange={(newVal) => onTokenChange(element.id, prop.key, prop.value, newVal)}
              />
            );
          }
          if (prop.type === "text") {
            return (
              <div key={`${element.id}:${prop.key}`} className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[var(--text-secondary)]">{prop.key}</span>
                <input
                  type="text"
                  defaultValue={prop.value}
                  onBlur={(e) => onTextChange(element.id, prop.key, e.target.value)}
                  className="w-[180px] rounded border border-[var(--studio-border)] bg-[var(--bg-app)] px-2 py-1 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)]"
                />
              </div>
            );
          }
          // Enum prop falls back to a select for now.
          return (
            <div key={`${element.id}:${prop.key}`} className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--text-secondary)]">{prop.key}</span>
              <select
                value={prop.value}
                onChange={(e) => onTextChange(element.id, prop.key, e.target.value)}
                className="rounded border border-[var(--studio-border)] bg-[var(--bg-app)] px-2 py-1 text-[11px] text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)]"
              >
                {prop.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function tokenCategory(prop: TokenProp): TokenType {
  switch (prop.type) {
    case "color-token":
      return "color";
    case "spacing-token":
      return "spacing";
    case "radius-token":
      return "radius";
    case "type-token":
      return "typography";
    case "shadow-token":
      return "effect";
  }
}
