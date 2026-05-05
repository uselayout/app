"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { ExternalLink, Loader2, RefreshCw, Wand2, X } from "lucide-react";
import type { ExtractedComponent, ExtractedComponentVariant } from "@/lib/types";
import type { Component, EditSchema } from "@/lib/types/component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ComponentEditor } from "@/components/studio/inspector/ComponentEditor";

interface Props {
  component: ExtractedComponent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Project id — required to render the form editor (token lookups, preview). */
  projectId?: string;
  /** Project-level Figma file URL — fallback when component lacks figmaUrl. */
  figmaFileUrl?: string;
  /** Saved Component generated from this imported component, if any. */
  linkedComponent?: Component | null;
  /** Generation in progress (true while POST is running). */
  generating?: boolean;
  /** Generation error message, shown inline. */
  generationError?: string | null;
  /** Fired when the user clicks "Generate code" / "Regenerate". */
  onGenerateCode?: (component: ExtractedComponent) => void;
  /** Fired when the user clicks Save changes in the editor. */
  onSaveEdits?: (componentId: string, next: { code: string; editSchema: EditSchema }) => void | Promise<void>;
  /** Fired when the user clicks Save as new variant. */
  onSaveAsNewVariant?: (componentId: string, next: { code: string; editSchema: EditSchema }) => void | Promise<void>;
}

export function ComponentInspectorDrawer({
  component,
  open,
  onOpenChange,
  projectId,
  figmaFileUrl,
  linkedComponent,
  generating,
  generationError,
  onGenerateCode,
  onSaveEdits,
  onSaveAsNewVariant,
}: Props) {
  if (!component) return null;

  const figmaUrl = component.figmaUrl ?? figmaFileUrl;
  const hasVariantDetails = (component.variantDetails?.length ?? 0) > 0;
  const variantAxes = component.variantGroupProperties
    ? Object.entries(component.variantGroupProperties)
    : [];

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[640px] flex-col border-l border-[var(--studio-border)] bg-[var(--bg-panel)] shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
          aria-describedby={undefined}
        >
          <Header
            component={component}
            figmaUrl={figmaUrl}
            onClose={() => onOpenChange(false)}
          />

          <div className="flex-1 overflow-y-auto">
            <Thumbnail component={component} />
            <Description component={component} />
            <VariantAxes axes={variantAxes} />
            {hasVariantDetails && component.variantDetails ? (
              <VariantGrid variants={component.variantDetails} />
            ) : null}
            <Properties component={component} />
            {linkedComponent && projectId ? (
              <ComponentEditor
                projectId={projectId}
                linkedComponent={linkedComponent}
                onSave={
                  onSaveEdits
                    ? (next) => onSaveEdits(linkedComponent.id, next)
                    : undefined
                }
                onSaveAsNew={
                  onSaveAsNewVariant
                    ? (next) => onSaveAsNewVariant(linkedComponent.id, next)
                    : undefined
                }
              />
            ) : linkedComponent ? (
              <GeneratedCodeView linkedComponent={linkedComponent} />
            ) : null}
            {generationError ? (
              <ErrorBanner message={generationError} />
            ) : null}
          </div>

          <Footer
            component={component}
            linkedComponent={linkedComponent}
            generating={generating}
            onGenerateCode={onGenerateCode}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Header({
  component,
  figmaUrl,
  onClose,
}: {
  component: ExtractedComponent;
  figmaUrl?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--studio-border)] px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <DialogPrimitive.Title className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {component.name}
          </DialogPrimitive.Title>
          {component.variantCount > 1 ? (
            <Badge
              variant="secondary"
              className="bg-[var(--bg-elevated)] text-[var(--text-muted)] text-[10px] px-1.5 py-0"
            >
              {component.variantCount} variants
            </Badge>
          ) : null}
        </div>
      </div>
      {figmaUrl ? (
        <a
          href={figmaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          title="Open in Figma"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Figma
        </a>
      ) : null}
      <button
        onClick={onClose}
        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function Thumbnail({ component }: { component: ExtractedComponent }) {
  if (!component.imageUrl) {
    return (
      <div className="m-5 flex aspect-[16/9] items-center justify-center rounded-lg border border-dashed border-[var(--studio-border)] bg-[var(--bg-surface)]">
        <div className="px-6 text-center">
          <p className="text-xs text-[var(--text-secondary)]">
            No thumbnail captured for this component yet.
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-muted)]">
            Re-push from the Figma plugin (v0.3+) to capture component images.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="m-5 overflow-hidden rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]">
      <img
        src={component.imageUrl}
        alt={component.name}
        className="h-auto w-full object-contain"
        loading="lazy"
      />
    </div>
  );
}

function Description({ component }: { component: ExtractedComponent }) {
  if (!component.description) return null;
  return (
    <div className="px-5 pb-4">
      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
        {component.description}
      </p>
    </div>
  );
}

function VariantAxes({ axes }: { axes: [string, string[]][] }) {
  if (axes.length === 0) return null;
  return (
    <div className="px-5 pb-4">
      <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Variant axes
      </h3>
      <div className="space-y-2">
        {axes.map(([key, values]) => (
          <div key={key} className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {key}
            </span>
            <div className="flex flex-wrap gap-1">
              {values.map((v) => (
                <span
                  key={`${key}-${v}`}
                  className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] font-mono"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantGrid({ variants }: { variants: ExtractedComponentVariant[] }) {
  return (
    <div className="px-5 pb-4">
      <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Variants ({variants.length})
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {variants.map((v) => (
          <div
            key={v.name}
            className="overflow-hidden rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)]"
          >
            {v.imageUrl ? (
              <img
                src={v.imageUrl}
                alt={v.name}
                className="h-24 w-full object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex h-24 items-center justify-center bg-[var(--bg-elevated)]">
                <span className="text-[10px] text-[var(--text-muted)]">No preview</span>
              </div>
            )}
            <div className="border-t border-[var(--studio-border)] px-2 py-1.5">
              <p className="truncate text-[10px] font-medium text-[var(--text-primary)]">
                {v.name}
              </p>
              {v.properties && Object.keys(v.properties).length > 0 ? (
                <p className="truncate text-[9px] text-[var(--text-muted)] font-mono">
                  {Object.entries(v.properties)
                    .map(([k, val]) => `${k}=${val}`)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Properties({ component }: { component: ExtractedComponent }) {
  if (!component.properties || Object.keys(component.properties).length === 0) {
    return null;
  }
  return (
    <div className="px-5 pb-4">
      <h3 className="mb-2 text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Properties
      </h3>
      <div className="flex flex-wrap gap-1">
        {Object.entries(component.properties).map(([key, prop]) => (
          <span
            key={key}
            className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] font-mono"
          >
            {key}: {prop.type}
            {prop.defaultValue ? ` = ${prop.defaultValue}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function GeneratedCodeView({ linkedComponent }: { linkedComponent: Component }) {
  return (
    <div className="border-t border-[var(--studio-border)] px-5 py-4">
      <h3 className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        <span>Generated code</span>
        <span className="font-mono normal-case tracking-normal opacity-60">
          v{linkedComponent.version}
        </span>
      </h3>
      <pre className="max-h-[280px] overflow-auto rounded border border-[var(--studio-border)] bg-[var(--bg-app)] p-3 text-[10px] leading-snug text-[var(--text-secondary)] font-mono">
        <code>{linkedComponent.code}</code>
      </pre>
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">
        Form editor with token pickers + live preview ships in the next update.
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-5 mb-4 rounded-md border border-[var(--color-error,#b3261e)]/40 bg-[var(--color-error,#b3261e)]/10 px-3 py-2 text-[11px] text-[var(--color-error,#b3261e)]">
      {message}
    </div>
  );
}

function Footer({
  component,
  linkedComponent,
  generating,
  onGenerateCode,
}: {
  component: ExtractedComponent;
  linkedComponent?: Component | null;
  generating?: boolean;
  onGenerateCode?: (component: ExtractedComponent) => void;
}) {
  const hasCode = Boolean(linkedComponent);
  const label = hasCode ? "Regenerate" : "Generate code from this component";
  const Icon = hasCode ? RefreshCw : Wand2;
  return (
    <div className="border-t border-[var(--studio-border)] px-5 py-3">
      <Button
        onClick={() => onGenerateCode?.(component)}
        disabled={!onGenerateCode || generating}
        className="w-full bg-[var(--studio-accent)] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)]"
      >
        {generating ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Icon className="mr-2 h-3.5 w-3.5" />
        )}
        {generating
          ? hasCode
            ? "Regenerating…"
            : "Generating…"
          : label}
      </Button>
      <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
        {hasCode
          ? "Regenerating overwrites the saved component."
          : "Uses your design tokens + the Figma reference image."}
      </p>
    </div>
  );
}
