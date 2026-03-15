"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { DesignToken, DesignTokenType } from "@/lib/types/token";
import { TokenSwatch } from "./TokenSwatch";

const TOKEN_TYPES: { key: DesignTokenType; label: string }[] = [
  { key: "color", label: "Colours" },
  { key: "typography", label: "Typography" },
  { key: "spacing", label: "Spacing" },
  { key: "radius", label: "Radius" },
  { key: "effect", label: "Effects" },
  { key: "motion", label: "Motion" },
];

interface TokenEditorProps {
  orgId: string;
  tokens: DesignToken[];
  selectedType: DesignTokenType;
  onTypeChange: (type: DesignTokenType) => void;
  onTokensChange: () => void;
  studioUrl?: string;
}

interface AddFormState {
  name: string;
  value: string;
  cssVariable: string;
  groupName: string;
  description: string;
}

const EMPTY_FORM: AddFormState = {
  name: "",
  value: "",
  cssVariable: "",
  groupName: "",
  description: "",
};

export function TokenEditor({
  orgId,
  tokens,
  selectedType,
  onTypeChange,
  onTokensChange,
  studioUrl = "/studio",
}: TokenEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Group tokens by groupName
  const grouped = new Map<string, DesignToken[]>();
  for (const token of tokens) {
    const group = token.groupName ?? "Ungrouped";
    const existing = grouped.get(group) ?? [];
    existing.push(token);
    grouped.set(group, existing);
  }

  async function handleAdd() {
    if (!addForm.name.trim() || !addForm.value.trim()) {
      toast.error("Name and value are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          type: selectedType,
          value: addForm.value.trim(),
          cssVariable: addForm.cssVariable.trim() || undefined,
          groupName: addForm.groupName.trim() || undefined,
          description: addForm.description.trim() || undefined,
          source: "manual" as const,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to create token" }));
        toast.error(err.error ?? "Failed to create token");
        return;
      }

      toast.success("Token created");
      setAddForm(EMPTY_FORM);
      setShowAddForm(false);
      onTokensChange();
    } catch {
      toast.error("Failed to create token");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(tokenId: string, value: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/tokens/${tokenId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        toast.error("Failed to update token");
        return;
      }

      toast.success("Token updated");
      onTokensChange();
    } catch {
      toast.error("Failed to update token");
    }
  }

  async function handleDelete(tokenId: string) {
    try {
      const res = await fetch(`/api/organizations/${orgId}/tokens/${tokenId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        toast.error("Failed to delete token");
        return;
      }

      toast.success("Token deleted");
      onTokensChange();
    } catch {
      toast.error("Failed to delete token");
    }
  }

  const isColorType = selectedType === "color";

  return (
    <div>
      {/* Type tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TOKEN_TYPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTypeChange(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-[var(--duration-base)] ${
              selectedType === key
                ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Token groups */}
      {tokens.length === 0 && !showAddForm ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No {TOKEN_TYPES.find((t) => t.key === selectedType)?.label.toLowerCase()} tokens yet
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Extract a design system in Studio to populate tokens, or add them manually.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <a
                href={studioUrl}
                className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
              >
                Open Studio
              </a>
              <button
                onClick={() => setShowAddForm(true)}
                className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
              >
                Add Manually
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([groupName, groupTokens]) => (
            <div key={groupName}>
              <h3 className="mb-3 text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">
                {groupName}
              </h3>
              {isColorType ? (
                <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                  {groupTokens.map((token) => (
                    <TokenSwatch
                      key={token.id}
                      token={token}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {groupTokens.map((token) => (
                    <TokenSwatch
                      key={token.id}
                      token={token}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add token form */}
      {showAddForm && (
        <div className="mt-6 rounded-[var(--studio-radius-lg)] border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
          <h4 className="mb-3 text-sm font-medium text-[var(--text-primary)]">
            Add Token
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Token name *"
              className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            <input
              type="text"
              value={addForm.value}
              onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))}
              placeholder="Value * (e.g. #6366F1, 16px)"
              className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            <input
              type="text"
              value={addForm.cssVariable}
              onChange={(e) => setAddForm((f) => ({ ...f, cssVariable: e.target.value }))}
              placeholder="CSS variable (optional)"
              className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            <input
              type="text"
              value={addForm.groupName}
              onChange={(e) => setAddForm((f) => ({ ...f, groupName: e.target.value }))}
              placeholder="Group name (optional)"
              className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            <input
              type="text"
              value={addForm.description}
              onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Description (optional)"
              className="col-span-full rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setAddForm(EMPTY_FORM);
              }}
              className="rounded-[var(--studio-radius-md)] bg-[var(--bg-hover)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add button (when form is hidden and tokens exist) */}
      {!showAddForm && tokens.length > 0 && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-6 rounded-[var(--studio-radius-md)] border border-dashed border-[var(--studio-border)] bg-transparent px-4 py-2 text-sm text-[var(--text-muted)] transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)] hover:text-[var(--text-secondary)]"
        >
          + Add Token
        </button>
      )}
    </div>
  );
}
