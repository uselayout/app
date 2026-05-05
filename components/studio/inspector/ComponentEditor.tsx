"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
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
}

/**
 * Form-driven editor for a generated component. Reads the editSchema, renders
 * one section per element with the appropriate input controls, and re-applies
 * deterministic edits to the TSX as the user changes values. Variant prop
 * changes are NOT mutations of the TSX — they're passed to the preview as
 * props instead, since the generated component is a function of those props.
 */
export function ComponentEditor({ projectId, linkedComponent, onSave, onSaveAsNew }: Props) {
  const initialSchema = linkedComponent.editSchema;
  const initialCode = linkedComponent.code;

  const [schema, setSchema] = useState<EditSchema | null>(initialSchema);
  const [code, setCode] = useState(initialCode);
  const [variantValues, setVariantValues] = useState<Record<string, string>>(
    initialSchema ? defaultVariantValues(initialSchema) : {}
  );

  const tokens = useProjectStore((s) => {
    const ed = s.projects.find((p) => p.id === projectId)?.extractionData;
    if (!ed) return [] as ExtractedToken[];
    return [
      ...ed.tokens.colors,
      ...ed.tokens.typography,
      ...ed.tokens.spacing,
      ...ed.tokens.radius,
      ...ed.tokens.effects,
    ];
  });

  const dirty = code !== initialCode;

  const reset = () => {
    setSchema(initialSchema);
    setCode(initialCode);
    setVariantValues(initialSchema ? defaultVariantValues(initialSchema) : {});
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
