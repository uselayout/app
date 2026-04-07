"use client";

import { useState } from "react";
import {
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  ArrowRight,
} from "lucide-react";
import type { ExtractionDiff, TokenChange, ComponentChange } from "@/lib/extraction/diff";

interface ExtractionDiffModalProps {
  diff: ExtractionDiff;
  onClose: () => void;
  onAccept: () => void;
}

function changeColour(change: "added" | "removed" | "modified"): string {
  switch (change) {
    case "added":
      return "text-emerald-400";
    case "removed":
      return "text-red-400";
    case "modified":
      return "text-amber-400";
  }
}

function changeBg(change: "added" | "removed" | "modified"): string {
  switch (change) {
    case "added":
      return "bg-emerald-400/10";
    case "removed":
      return "bg-red-400/10";
    case "modified":
      return "bg-amber-400/10";
  }
}

function changeLabel(change: "added" | "removed" | "modified"): string {
  switch (change) {
    case "added":
      return "Added";
    case "removed":
      return "Removed";
    case "modified":
      return "Modified";
  }
}

function ChangeIcon({ change }: { change: "added" | "removed" | "modified" }) {
  const cls = `w-3 h-3 ${changeColour(change)}`;
  if (change === "added") return <Plus className={cls} />;
  if (change === "removed") return <Minus className={cls} />;
  return <ArrowRight className={cls} />;
}

function isHexColour(value: string): boolean {
  return /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value.trim());
}

function ColourSwatch({ value }: { value: string }) {
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-sm border border-[var(--studio-border)] flex-shrink-0"
      style={{ backgroundColor: value.trim() }}
      aria-hidden="true"
    />
  );
}

function TokenRow({ token }: { token: TokenChange }) {
  const showSwatches =
    token.type === "color" &&
    token.change === "modified" &&
    token.previousValue &&
    token.currentValue;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 rounded-md ${changeBg(token.change)}`}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <ChangeIcon change={token.change} />
        <span className={`text-xs font-medium ${changeColour(token.change)}`}>
          {changeLabel(token.change)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[var(--text-primary)] text-sm font-medium truncate">
            {token.name}
          </span>
          {token.cssVariable && (
            <span className="text-[var(--text-muted)] text-xs font-mono truncate">
              {token.cssVariable}
            </span>
          )}
          {token.mode && (
            <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--text-muted)] rounded-sm bg-[var(--bg-elevated)] px-1 py-0.5 flex-shrink-0">
              {token.mode}
            </span>
          )}
          <span
            className="text-[var(--text-muted)] text-xs px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--studio-border)] flex-shrink-0"
          >
            {token.type}
          </span>
        </div>

        {token.change === "modified" && token.previousValue && token.currentValue && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {showSwatches && <ColourSwatch value={token.previousValue} />}
              <span className="text-[var(--text-secondary)] text-xs font-mono line-through">
                {token.previousValue}
              </span>
            </div>
            <ArrowRight className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex items-center gap-1.5">
              {showSwatches && <ColourSwatch value={token.currentValue} />}
              <span className="text-[var(--text-primary)] text-xs font-mono">
                {token.currentValue}
              </span>
            </div>
          </div>
        )}

        {token.change === "added" && token.currentValue && (
          <div className="flex items-center gap-1.5 mt-1">
            {token.type === "color" && isHexColour(token.currentValue) && (
              <ColourSwatch value={token.currentValue} />
            )}
            <span className="text-[var(--text-secondary)] text-xs font-mono">
              {token.currentValue}
            </span>
          </div>
        )}

        {token.change === "removed" && token.previousValue && (
          <div className="flex items-center gap-1.5 mt-1">
            {token.type === "color" && isHexColour(token.previousValue) && (
              <ColourSwatch value={token.previousValue} />
            )}
            <span className="text-[var(--text-secondary)] text-xs font-mono line-through">
              {token.previousValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentRow({ component }: { component: ComponentChange }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-2.5 rounded-md ${changeBg(component.change)}`}
    >
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <ChangeIcon change={component.change} />
        <span className={`text-xs font-medium ${changeColour(component.change)}`}>
          {changeLabel(component.change)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[var(--text-primary)] text-sm font-medium">
          {component.name}
        </span>
        {component.details && (
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{component.details}</p>
        )}
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  badge: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, badge, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--studio-border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-panel)] hover:bg-[var(--bg-surface)] transition-colors duration-[var(--duration-base)] text-left"
      >
        <div className="flex items-center gap-2.5">
          {open ? (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          )}
          <span className="text-[var(--text-primary)] text-sm font-medium">{title}</span>
          {badge > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--studio-border)]">
              {badge}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 py-3 bg-[var(--bg-surface)] flex flex-col gap-2 border-t border-[var(--studio-border)]">
          {children}
        </div>
      )}
    </div>
  );
}

export function ExtractionDiffModal({
  diff,
  onClose,
  onAccept,
}: ExtractionDiffModalProps) {
  const tokenTotal =
    diff.tokens.added + diff.tokens.removed + diff.tokens.modified;
  const componentTotal =
    diff.components.added + diff.components.removed + diff.components.modified;
  const fontTotal = diff.fonts.added.length + diff.fonts.removed.length;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Extraction diff"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-app)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--studio-border)]">
          <div className="flex-1 min-w-0">
            <h2 className="text-[var(--text-primary)] text-base font-semibold leading-snug">
              Extraction Changes
            </h2>
            {diff.summary && (
              <p className="text-[var(--text-secondary)] text-sm mt-0.5 leading-snug">
                {diff.summary}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[var(--text-secondary)] border border-[var(--studio-border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--text-on-accent)] bg-[var(--studio-accent)] hover:bg-[var(--studio-accent-hover)] transition-all duration-[var(--duration-base)]"
            >
              <Check className="w-3.5 h-3.5" />
              Accept Changes
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {(tokenTotal > 0 || componentTotal > 0 || fontTotal > 0) && (
          <div className="flex items-center gap-4 px-5 py-2.5 bg-[var(--bg-panel)] border-b border-[var(--studio-border)] text-xs text-[var(--text-muted)] flex-wrap">
            {tokenTotal > 0 && (
              <span>
                <span className="text-[var(--text-secondary)] font-medium">{tokenTotal}</span>{" "}
                token {tokenTotal === 1 ? "change" : "changes"}
              </span>
            )}
            {componentTotal > 0 && (
              <span>
                <span className="text-[var(--text-secondary)] font-medium">{componentTotal}</span>{" "}
                component {componentTotal === 1 ? "change" : "changes"}
              </span>
            )}
            {fontTotal > 0 && (
              <span>
                <span className="text-[var(--text-secondary)] font-medium">{fontTotal}</span>{" "}
                font {fontTotal === 1 ? "change" : "changes"}
              </span>
            )}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 min-h-0">
          {/* No changes state */}
          {tokenTotal === 0 && componentTotal === 0 && fontTotal === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="w-8 h-8 text-[var(--text-muted)] mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">No changes detected</p>
              <p className="text-[var(--text-muted)] text-xs mt-1">
                The extraction result matches the previous version.
              </p>
            </div>
          )}

          {/* Tokens section */}
          {tokenTotal > 0 && (
            <Section title="Tokens" badge={tokenTotal} defaultOpen>
              {diff.tokens.changes.map((token, i) => (
                <TokenRow key={`${token.name}-${i}`} token={token} />
              ))}
            </Section>
          )}

          {/* Components section */}
          {componentTotal > 0 && (
            <Section title="Components" badge={componentTotal} defaultOpen={tokenTotal === 0}>
              {diff.components.changes.map((component, i) => (
                <ComponentRow key={`${component.name}-${i}`} component={component} />
              ))}
            </Section>
          )}

          {/* Fonts section */}
          {fontTotal > 0 && (
            <Section
              title="Fonts"
              badge={fontTotal}
              defaultOpen={tokenTotal === 0 && componentTotal === 0}
            >
              {diff.fonts.added.map((font) => (
                <div
                  key={`added-${font}`}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md ${changeBg("added")}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">Added</span>
                  </div>
                  <span className="text-[var(--text-primary)] text-sm font-medium">{font}</span>
                </div>
              ))}
              {diff.fonts.removed.map((font) => (
                <div
                  key={`removed-${font}`}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md ${changeBg("removed")}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Minus className="w-3 h-3 text-red-400" />
                    <span className="text-xs font-medium text-red-400">Removed</span>
                  </div>
                  <span className="text-[var(--text-primary)] text-sm font-medium">{font}</span>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--studio-border)] bg-[var(--bg-panel)] rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] border border-[var(--studio-border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all duration-[var(--duration-base)]"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-[var(--text-on-accent)] bg-[var(--studio-accent)] hover:bg-[var(--studio-accent-hover)] transition-all duration-[var(--duration-base)]"
          >
            <Check className="w-4 h-4" />
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}
