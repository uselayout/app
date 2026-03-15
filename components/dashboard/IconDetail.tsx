"use client";

import { useState } from "react";
import type { DesignIcon } from "@/lib/types/icon";
import { copyToClipboard } from "@/lib/util/copy-to-clipboard";
import { toast } from "sonner";

interface IconDetailProps {
  icon: DesignIcon;
  orgId: string;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const PREVIEW_SIZES = [16, 20, 24, 32];

function iconToReactName(name: string): string {
  return name
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// Note: SVG content is sanitised server-side in the API route
// (script tags and on* event attributes are stripped before storage)
function renderSvgAtSize(svg: string, size: number): string {
  let result = svg;
  if (/width="[^"]*"/.test(result)) {
    result = result.replace(/width="[^"]*"/, `width="${size}"`);
  }
  if (/height="[^"]*"/.test(result)) {
    result = result.replace(/height="[^"]*"/, `height="${size}"`);
  }
  if (!/width=/.test(svg)) {
    result = result.replace(/^<svg/, `<svg width="${size}" height="${size}"`);
  }
  return result;
}

export function IconDetail({
  icon,
  orgId,
  onClose,
  onUpdated,
  onDeleted,
}: IconDetailProps) {
  const [name, setName] = useState(icon.name);
  const [category, setCategory] = useState(icon.category);
  const [tags, setTags] = useState(icon.tags.join(", "));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/icons/${icon.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            tags: tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          }),
        }
      );
      if (res.ok) {
        toast.success("Icon updated");
        onUpdated();
      } else {
        toast.error("Failed to update icon");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(
      `/api/organizations/${orgId}/icons/${icon.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      toast.success("Icon deleted");
      onDeleted();
    } else {
      toast.error("Failed to delete icon");
    }
  }

  async function copySvg() {
    const ok = await copyToClipboard(icon.svg);
    if (ok) toast.success("SVG copied");
  }

  async function copyReact() {
    const reactName = iconToReactName(icon.name);
    const jsx = `<${reactName} size={24} className="" />`;
    const ok = await copyToClipboard(jsx);
    if (ok) toast.success("React component copied");
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-[var(--studio-border)] bg-[var(--bg-panel)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--studio-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Icon Detail
        </h2>
        <button
          onClick={onClose}
          className="rounded p-1 text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Size previews */}
        <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-end justify-center gap-6">
            {PREVIEW_SIZES.map((size) => (
              <div key={size} className="flex flex-col items-center gap-2">
                <div
                  className="text-[var(--text-primary)]"
                  dangerouslySetInnerHTML={{
                    __html: renderSvgAtSize(icon.svg, size),
                  }}
                  style={{ width: size, height: size }}
                />
                <span className="text-xs text-[var(--text-muted)]">
                  {size}px
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Name */}
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-muted)]">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
          />
        </label>

        {/* Category */}
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-muted)]">
            Category
          </span>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
          />
        </label>

        {/* Tags */}
        <label className="block">
          <span className="mb-1 block text-xs text-[var(--text-muted)]">
            Tags (comma-separated)
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="icon, navigation, ui"
            className="w-full rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
          />
        </label>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {/* Copy buttons */}
        <div className="flex gap-2">
          <button
            onClick={copySvg}
            className="flex-1 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
          >
            Copy SVG
          </button>
          <button
            onClick={copyReact}
            className="flex-1 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
          >
            Copy React
          </button>
        </div>

        {/* SVG source */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            SVG Source
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3 font-mono text-xs text-[var(--text-secondary)]">
            {icon.svg}
          </pre>
        </details>

        {/* Delete */}
        <div className="border-t border-[var(--studio-border)] pt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-400">Delete this icon?</span>
              <button
                onClick={handleDelete}
                className="rounded-[var(--studio-radius-md)] bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete Icon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
