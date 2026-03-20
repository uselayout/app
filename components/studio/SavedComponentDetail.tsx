"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Loader2,
  Pencil,
  ChevronDown,
  ChevronUp,
  Figma,
  Sparkles,
} from "lucide-react";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { buildSrcdoc, extractComponentName, sanitizeRelativeSrc } from "@/lib/explore/preview-helpers";
import type { Component } from "@/lib/types/component";

interface SavedComponentDetailProps {
  component: Component;
  onClose: () => void;
  onUpdate: (updated: Component) => void;
  onDelete: (id: string) => void;
  onPushToFigma?: (component: Component) => void;
  onOpenInCanvas?: (component: Component) => void;
  orgId: string;
}

// ---------------------------------------------------------------------------
// Inline editable field
// ---------------------------------------------------------------------------

function InlineEdit({
  value,
  onSave,
  label,
  multiline,
  placeholder,
}: {
  value: string;
  onSave: (val: string) => void;
  label: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed !== value) onSave(trimmed);
  }, [draft, value, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        commit();
      }
      if (e.key === "Escape") {
        setDraft(value);
        setEditing(false);
      }
    },
    [commit, multiline, value]
  );

  if (editing) {
    const cls =
      "w-full rounded-md border border-[var(--studio-border-focus)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none";
    return multiline ? (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder={placeholder}
        className={cls + " resize-none"}
      />
    ) : (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cls}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="group/edit flex items-center gap-1.5 text-left"
      title={`Edit ${label}`}
    >
      <span className="text-xs text-[var(--text-primary)]">
        {value || <span className="italic text-[var(--text-muted)]">{placeholder ?? `Add ${label}`}</span>}
      </span>
      <Pencil
        size={10}
        className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover/edit:opacity-100 transition-opacity"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tags editor
// ---------------------------------------------------------------------------

function TagsEdit({
  tags,
  onSave,
}: {
  tags: string[];
  onSave: (tags: string[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tags.join(", "));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    const parsed = draft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (JSON.stringify(parsed) !== JSON.stringify(tags)) onSave(parsed);
  }, [draft, tags, onSave]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(tags.join(", ")); setEditing(false); }
        }}
        placeholder="hero, landing, marketing"
        className="w-full rounded-md border border-[var(--studio-border-focus)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)] outline-none"
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(tags.join(", ")); setEditing(true); }}
      className="group/edit flex items-center gap-1.5 text-left"
      title="Edit tags"
    >
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-xs italic text-[var(--text-muted)]">Add tags</span>
      )}
      <Pencil
        size={10}
        className="shrink-0 text-[var(--text-muted)] opacity-0 group-hover/edit:opacity-100 transition-opacity"
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

function DetailPreview({ component }: { component: Component }) {
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      try {
        let js = component.compiledJs;
        if (!js) {
          const res = await fetch("/api/transpile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: component.code }),
          });
          if (!res.ok) { setError(true); return; }
          const data = await res.json();
          js = data.js;
        }
        if (!cancelled && js) {
          const name = extractComponentName(component.code);
          const sanitised = sanitizeRelativeSrc(js);
          setSrcdoc(buildSrcdoc(sanitised, name));
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }
    prepare();
    return () => { cancelled = true; };
  }, [component.code, component.compiledJs]);

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-white text-xs text-neutral-400">
        Preview unavailable
      </div>
    );
  }

  if (!srcdoc) {
    return (
      <div className="flex h-[400px] items-center justify-center bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
      </div>
    );
  }

  return (
    <div className="relative h-[400px] overflow-hidden bg-white">
      <iframe
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        className="h-[800px] w-[200%] origin-top-left scale-50 border-0"
        title={`Preview of ${component.name}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main detail component
// ---------------------------------------------------------------------------

export function SavedComponentDetail({
  component,
  onClose,
  onUpdate,
  onDelete,
  onPushToFigma,
  onOpenInCanvas,
  orgId,
}: SavedComponentDetailProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleSave = useCallback(
    async (field: string, value: unknown) => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/components/${component.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [field]: value }),
          }
        );
        if (res.ok) {
          const updated = await res.json();
          onUpdate(updated);
        }
      } finally {
        setSaving(false);
      }
    },
    [orgId, component.id, onUpdate]
  );

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/components/${component.id}`,
        { method: "DELETE" }
      );
      if (res.ok) onDelete(component.id);
    } finally {
      setDeleting(false);
    }
  }, [orgId, component.id, onDelete]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(component.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [component.code]);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Slide-over panel */}
      <div className="flex w-full max-w-2xl flex-col border-l border-[var(--studio-border)] bg-[var(--bg-panel)] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--studio-border)] px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="flex-1 text-sm font-semibold text-[var(--text-primary)] truncate">
            {component.name}
          </h2>
          {saving && (
            <span className="text-[10px] text-[var(--text-muted)] animate-pulse">Saving…</span>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Delete component"
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Preview */}
          <DetailPreview component={component} />

          {/* Metadata */}
          <div className="space-y-3 border-t border-[var(--studio-border)] px-4 py-4">
            <div className="grid grid-cols-[80px_1fr] items-start gap-2">
              <span className="text-[11px] font-medium text-[var(--text-muted)] pt-0.5">Name</span>
              <InlineEdit
                value={component.name}
                onSave={(v) => handleSave("name", v)}
                label="name"
              />

              <span className="text-[11px] font-medium text-[var(--text-muted)] pt-0.5">Type</span>
              <span className="text-xs text-[var(--text-primary)] capitalize">{component.designType}</span>

              <span className="text-[11px] font-medium text-[var(--text-muted)] pt-0.5">Category</span>
              <InlineEdit
                value={component.category === "uncategorised" ? "" : component.category}
                onSave={(v) => handleSave("category", v || "uncategorised")}
                label="category"
                placeholder="Add category"
              />

              <span className="text-[11px] font-medium text-[var(--text-muted)] pt-0.5">Tags</span>
              <TagsEdit
                tags={component.tags}
                onSave={(v) => handleSave("tags", v)}
              />

              <span className="text-[11px] font-medium text-[var(--text-muted)] pt-0.5">Description</span>
              <InlineEdit
                value={component.description ?? ""}
                onSave={(v) => handleSave("description", v || null)}
                label="description"
                multiline
                placeholder="Add description"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--studio-border)] px-4 py-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  Copy code
                </>
              )}
            </button>

            {onPushToFigma && (
              <button
                onClick={() => onPushToFigma(component)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Figma size={12} />
                Push to Figma
              </button>
            )}

            {onOpenInCanvas && (
              <button
                onClick={() => onOpenInCanvas(component)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Sparkles size={12} />
                Refine with AI
              </button>
            )}
          </div>

          {/* Code */}
          <div className="border-t border-[var(--studio-border)]">
            <button
              onClick={() => setShowCode(!showCode)}
              className="flex w-full items-center gap-2 px-4 py-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {showCode ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Code ({component.code.split("\n").length} lines)
            </button>
            {showCode && (
              <div className="max-h-80 overflow-auto border-t border-[var(--studio-border)] bg-[var(--bg-app)]">
                <pre className="p-4 text-[11px] leading-relaxed text-[var(--text-secondary)] font-mono whitespace-pre-wrap">
                  {component.code}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
