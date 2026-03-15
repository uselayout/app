"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Typeface, TypefaceRole, TypefaceSource, TypeScale } from "@/lib/types/typography";

// ─── Constants ────────────────────────────────────────────────────────────────

const WEIGHT_OPTIONS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];
const ROLE_OPTIONS: { value: TypefaceRole; label: string }[] = [
  { value: "heading", label: "Heading" },
  { value: "body", label: "Body" },
  { value: "mono", label: "Mono" },
  { value: "display", label: "Display" },
  { value: "accent", label: "Accent" },
];
const SOURCE_OPTIONS: { value: TypefaceSource; label: string }[] = [
  { value: "google", label: "Google Fonts" },
  { value: "custom", label: "Custom" },
  { value: "system", label: "System" },
  { value: "extracted", label: "Extracted" },
];
const SPECIMEN_WEIGHTS = ["400", "500", "600", "700"];
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: TypefaceRole | null }) {
  if (!role) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--studio-accent)]">
      {role}
    </span>
  );
}

function SourceBadge({ source }: { source: TypefaceSource | null }) {
  if (!source) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-[var(--studio-border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
      {source}
    </span>
  );
}

function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() && draft !== value) {
      onSave(draft.trim());
    } else {
      setDraft(value);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`cursor-pointer rounded px-1 transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] ${className ?? ""}`}
      >
        {value}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={`rounded border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-1 text-[var(--text-primary)] outline-none ${className ?? ""}`}
    />
  );
}

// ─── Google Fonts Loader ──────────────────────────────────────────────────────

function GoogleFontLink({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <style>{`@import url('${url}');`}</style>
  );
}

// ─── Typeface Form ────────────────────────────────────────────────────────────

interface TypefaceFormData {
  family: string;
  source: TypefaceSource | "";
  role: TypefaceRole | "";
  googleFontsUrl: string;
  weights: string[];
}

const EMPTY_TYPEFACE_FORM: TypefaceFormData = {
  family: "",
  source: "",
  role: "",
  googleFontsUrl: "",
  weights: ["400", "700"],
};

function TypefaceForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: TypefaceFormData;
  onSubmit: (data: TypefaceFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<TypefaceFormData>(initial ?? EMPTY_TYPEFACE_FORM);

  return (
    <div className="space-y-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Font Family
          </label>
          <input
            value={form.family}
            onChange={(e) => setForm({ ...form, family: e.target.value })}
            placeholder="Inter"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Source
          </label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value as TypefaceSource | "" })}
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          >
            <option value="">Select source...</option>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Role
          </label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as TypefaceRole | "" })}
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          >
            <option value="">No role</option>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Google Fonts URL
          </label>
          <input
            value={form.googleFontsUrl}
            onChange={(e) => setForm({ ...form, googleFontsUrl: e.target.value })}
            placeholder="https://fonts.googleapis.com/css2?family=..."
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
          Weights
        </label>
        <div className="flex flex-wrap gap-2">
          {WEIGHT_OPTIONS.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => {
                const next = form.weights.includes(w)
                  ? form.weights.filter((x) => x !== w)
                  : [...form.weights, w].sort();
                setForm({ ...form, weights: next });
              }}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition-all duration-[var(--duration-base)] ${
                form.weights.includes(w)
                  ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)] text-[var(--studio-accent)]"
                  : "border-[var(--studio-border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:border-[var(--studio-border-strong)]"
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting || !form.family.trim()}
          onClick={() => onSubmit(form)}
          className="rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Scale Form ───────────────────────────────────────────────────────────────

interface ScaleFormData {
  typefaceId: string;
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
}

const EMPTY_SCALE_FORM: ScaleFormData = {
  typefaceId: "",
  name: "",
  fontSize: "16px",
  fontWeight: "400",
  lineHeight: "1.5",
  letterSpacing: "0",
  textTransform: "",
};

function ScaleForm({
  typefaces,
  onSubmit,
  onCancel,
  submitting,
}: {
  typefaces: Typeface[];
  onSubmit: (data: ScaleFormData) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<ScaleFormData>({
    ...EMPTY_SCALE_FORM,
    typefaceId: typefaces[0]?.id ?? "",
  });

  return (
    <div className="space-y-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Typeface
          </label>
          <select
            value={form.typefaceId}
            onChange={(e) => setForm({ ...form, typefaceId: e.target.value })}
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          >
            {typefaces.map((t) => (
              <option key={t.id} value={t.id}>
                {t.family}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Name
          </label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Heading 1, Body Small"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Font Size
          </label>
          <input
            value={form.fontSize}
            onChange={(e) => setForm({ ...form, fontSize: e.target.value })}
            placeholder="16px"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Font Weight
          </label>
          <input
            value={form.fontWeight}
            onChange={(e) => setForm({ ...form, fontWeight: e.target.value })}
            placeholder="400"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Line Height
          </label>
          <input
            value={form.lineHeight}
            onChange={(e) => setForm({ ...form, lineHeight: e.target.value })}
            placeholder="1.5"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Letter Spacing
          </label>
          <input
            value={form.letterSpacing}
            onChange={(e) => setForm({ ...form, letterSpacing: e.target.value })}
            placeholder="0"
            className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all duration-[var(--duration-base)] focus:border-[var(--studio-border-focus)]"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting || !form.name.trim() || !form.typefaceId}
          onClick={() => onSubmit(form)}
          className="rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface TypographyEditorProps {
  orgId: string;
  studioUrl?: string;
}

export function TypographyEditor({ orgId, studioUrl = "/studio" }: TypographyEditorProps) {
  const [typefaces, setTypefaces] = useState<Typeface[]>([]);
  const [scaleEntries, setScaleEntries] = useState<TypeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTypefaceForm, setShowTypefaceForm] = useState(false);
  const [editingTypefaceId, setEditingTypefaceId] = useState<string | null>(null);
  const [showScaleForm, setShowScaleForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [tfRes, scRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/typography`),
        fetch(`/api/organizations/${orgId}/typography/scale`),
      ]);

      if (tfRes.ok) setTypefaces((await tfRes.json()) as Typeface[]);
      if (scRes.ok) setScaleEntries((await scRes.json()) as TypeScale[]);
    } catch {
      toast.error("Failed to load typography data");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // ─── Typeface handlers ────────────────────────────────────────────────────

  async function handleCreateTypeface(data: TypefaceFormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family: data.family.trim(),
          source: data.source || undefined,
          role: data.role || undefined,
          googleFontsUrl: data.googleFontsUrl || undefined,
          weights: data.weights,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Failed to create typeface");
        return;
      }

      toast.success("Typeface created");
      setShowTypefaceForm(false);
      await fetchAll();
    } catch {
      toast.error("Failed to create typeface");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateTypeface(id: string, data: TypefaceFormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          family: data.family.trim(),
          source: data.source || undefined,
          role: data.role || null,
          googleFontsUrl: data.googleFontsUrl || null,
          weights: data.weights,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Failed to update typeface");
        return;
      }

      toast.success("Typeface updated");
      setEditingTypefaceId(null);
      await fetchAll();
    } catch {
      toast.error("Failed to update typeface");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTypeface(id: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete typeface");
        return;
      }

      toast.success("Typeface deleted");
      setDeleteConfirmId(null);
      await fetchAll();
    } catch {
      toast.error("Failed to delete typeface");
    }
  }

  // ─── Scale handlers ──────────────────────────────────────────────────────

  async function handleCreateScale(data: ScaleFormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography/scale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typefaceId: data.typefaceId,
          name: data.name.trim(),
          fontSize: data.fontSize,
          fontWeight: data.fontWeight,
          lineHeight: data.lineHeight,
          letterSpacing: data.letterSpacing || "0",
          textTransform: data.textTransform || undefined,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        toast.error(err.error ?? "Failed to create scale entry");
        return;
      }

      toast.success("Scale entry created");
      setShowScaleForm(false);
      await fetchAll();
    } catch {
      toast.error("Failed to create scale entry");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateScaleField(id: string, field: string, value: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography/scale/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        toast.error("Failed to update");
        return;
      }

      await fetchAll();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDeleteScale(id: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/typography/scale/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete scale entry");
        return;
      }

      toast.success("Scale entry deleted");
      await fetchAll();
    } catch {
      toast.error("Failed to delete scale entry");
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function typefaceForScale(entry: TypeScale): Typeface | undefined {
    return typefaces.find((t) => t.id === entry.typefaceId);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Load Google Fonts for preview */}
      {typefaces
        .filter((t) => t.googleFontsUrl)
        .map((t) => (
          <GoogleFontLink key={t.id} url={t.googleFontsUrl} />
        ))}

      {/* ── Typefaces Section ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Typefaces</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Font families used across your design system
            </p>
          </div>
          {!showTypefaceForm && (
            <button
              type="button"
              onClick={() => setShowTypefaceForm(true)}
              className="rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
            >
              Add Typeface
            </button>
          )}
        </div>

        {showTypefaceForm && (
          <div className="mb-4">
            <TypefaceForm
              onSubmit={handleCreateTypeface}
              onCancel={() => setShowTypefaceForm(false)}
              submitting={submitting}
            />
          </div>
        )}

        {typefaces.length === 0 && !showTypefaceForm && (
          <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No typefaces yet
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Extract a design system in Studio to populate typography, or add fonts manually.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <a
                href={studioUrl}
                className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
              >
                Open Studio
              </a>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {typefaces.map((tf) =>
            editingTypefaceId === tf.id ? (
              <TypefaceForm
                key={tf.id}
                initial={{
                  family: tf.family,
                  source: tf.source ?? "",
                  role: tf.role ?? "",
                  googleFontsUrl: tf.googleFontsUrl ?? "",
                  weights: tf.weights,
                }}
                onSubmit={(data) => handleUpdateTypeface(tf.id, data)}
                onCancel={() => setEditingTypefaceId(null)}
                submitting={submitting}
              />
            ) : (
              <div
                key={tf.id}
                className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base font-semibold text-[var(--text-primary)]"
                      style={{ fontFamily: tf.family }}
                    >
                      {tf.family}
                    </h3>
                    <RoleBadge role={tf.role} />
                    <SourceBadge source={tf.source} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTypefaceId(tf.id)}
                      className="rounded-md border border-[var(--studio-border)] px-3 py-1 text-xs text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
                    >
                      Edit
                    </button>
                    {deleteConfirmId === tf.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteTypeface(tf.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="rounded-md border border-[var(--studio-border)] px-3 py-1 text-xs text-[var(--text-muted)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(tf.id)}
                        className="rounded-md border border-[var(--studio-border)] px-3 py-1 text-xs text-red-400 transition-all duration-[var(--duration-base)] hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Weight labels */}
                <div className="mb-2 flex flex-wrap gap-1">
                  {tf.weights.map((w) => (
                    <span
                      key={w}
                      className="rounded bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] font-mono text-[var(--text-muted)]"
                    >
                      {w}
                    </span>
                  ))}
                </div>

                {/* Weight specimens */}
                <div className="space-y-1">
                  {SPECIMEN_WEIGHTS.filter((w) => tf.weights.includes(w)).map((w) => (
                    <p
                      key={w}
                      className="text-sm text-[var(--text-secondary)]"
                      style={{ fontFamily: tf.family, fontWeight: Number(w) }}
                    >
                      <span className="mr-2 inline-block w-8 font-mono text-[10px] text-[var(--text-muted)]">
                        {w}
                      </span>
                      {SAMPLE_TEXT}
                    </p>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Type Scale Section ─────────────────────────────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Type Scale</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Named text styles with specific size, weight, and spacing
            </p>
          </div>
          {!showScaleForm && typefaces.length > 0 && (
            <button
              type="button"
              onClick={() => setShowScaleForm(true)}
              className="rounded-md bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
            >
              Add Scale Entry
            </button>
          )}
        </div>

        {showScaleForm && (
          <div className="mb-4">
            <ScaleForm
              typefaces={typefaces}
              onSubmit={handleCreateScale}
              onCancel={() => setShowScaleForm(false)}
              submitting={submitting}
            />
          </div>
        )}

        {scaleEntries.length === 0 && !showScaleForm && (
          <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {typefaces.length === 0
                ? "Add a typeface first, then create scale entries."
                : "No scale entries yet. Define your type scale to get started."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {scaleEntries.map((entry) => {
            const tf = typefaceForScale(entry);
            return (
              <div
                key={entry.id}
                className="group rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)]"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {entry.name}
                    </span>
                    {tf && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {tf.family}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteScale(entry.id)}
                    className="rounded-md border border-[var(--studio-border)] px-2 py-0.5 text-[10px] text-red-400 opacity-0 transition-all duration-[var(--duration-base)] group-hover:opacity-100 hover:bg-red-500/10"
                  >
                    Delete
                  </button>
                </div>

                {/* Live preview */}
                <p
                  className="mb-3 text-[var(--text-primary)]"
                  style={{
                    fontFamily: tf?.family,
                    fontSize: entry.fontSize,
                    fontWeight: Number(entry.fontWeight),
                    lineHeight: entry.lineHeight,
                    letterSpacing: entry.letterSpacing,
                    textTransform: (entry.textTransform as React.CSSProperties["textTransform"]) ?? undefined,
                  }}
                >
                  {SAMPLE_TEXT}
                </p>

                {/* Editable properties */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="text-[var(--text-muted)]">
                    size:{" "}
                    <InlineEdit
                      value={entry.fontSize}
                      onSave={(v) => handleUpdateScaleField(entry.id, "fontSize", v)}
                      className="font-mono text-[var(--text-secondary)]"
                    />
                  </span>
                  <span className="text-[var(--text-muted)]">
                    weight:{" "}
                    <InlineEdit
                      value={entry.fontWeight}
                      onSave={(v) => handleUpdateScaleField(entry.id, "fontWeight", v)}
                      className="font-mono text-[var(--text-secondary)]"
                    />
                  </span>
                  <span className="text-[var(--text-muted)]">
                    line-height:{" "}
                    <InlineEdit
                      value={entry.lineHeight}
                      onSave={(v) => handleUpdateScaleField(entry.id, "lineHeight", v)}
                      className="font-mono text-[var(--text-secondary)]"
                    />
                  </span>
                  <span className="text-[var(--text-muted)]">
                    spacing:{" "}
                    <InlineEdit
                      value={entry.letterSpacing}
                      onSave={(v) => handleUpdateScaleField(entry.id, "letterSpacing", v)}
                      className="font-mono text-[var(--text-secondary)]"
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
