"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ApiKey, ApiKeyScope, ApiKeyWithSecret } from "@/lib/types/api-key";

interface ApiKeyManagerProps {
  orgId: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--studio-accent-subtle)] px-2 py-0.5 text-[10px] font-medium text-[var(--studio-accent)]">
      {scope}
    </span>
  );
}

export function ApiKeyManager({ orgId }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>(["read"]);
  const [revokeConfirmId, setRevokeConfirmId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/api-keys`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data as ApiKey[]);
      }
    } catch {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  async function handleCreate() {
    if (!newKeyName.trim()) {
      toast.error("Key name is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error((err as { error?: string }).error ?? "Failed to create key");
        return;
      }

      const created = (await res.json()) as ApiKeyWithSecret;
      setNewKeySecret(created.secretKey);
      setNewKeyName("");
      setSelectedScopes(["read"]);
      setShowCreateForm(false);
      void fetchKeys();
      toast.success("API key created");
    } catch {
      toast.error("Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    setRevoking(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/api-keys/${keyId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        toast.error("Failed to revoke key");
        return;
      }

      setKeys((prev) => prev.filter((k) => k.id !== keyId));
      setRevokeConfirmId(null);
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke key");
    } finally {
      setRevoking(false);
    }
  }

  function toggleScope(scope: ApiKeyScope) {
    setSelectedScopes((prev) => {
      if (prev.includes(scope)) {
        const next = prev.filter((s) => s !== scope);
        return next.length === 0 ? [scope] : next;
      }
      return [...prev, scope];
    });
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Copied to clipboard");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            API Keys
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage keys for programmatic access to your design system
          </p>
        </div>
        {!showCreateForm && !newKeySecret && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
          >
            Create Key
          </button>
        )}
      </div>

      {/* New key secret display */}
      {newKeySecret && (
        <div className="mt-6 rounded-lg border border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)] p-4">
          <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">
            Copy this key now &mdash; you won&apos;t be able to see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-[var(--bg-app)] px-3 py-2 font-mono text-sm text-[var(--text-primary)]">
              {newKeySecret}
            </code>
            <button
              onClick={() => void copyToClipboard(newKeySecret)}
              className="rounded-md bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            >
              Copy
            </button>
          </div>
          <button
            onClick={() => setNewKeySecret(null)}
            className="mt-3 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          >
            Done
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="key-name"
                className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
              >
                Key name
              </label>
              <input
                id="key-name"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. CLI Key, GitHub Actions"
                className="w-full rounded-md border border-[var(--studio-border)] bg-[var(--bg-app)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus:border-[var(--studio-border-focus)] focus:outline-none"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                Scopes
              </p>
              <div className="flex gap-3">
                {(["read", "write"] as const).map((scope) => (
                  <label
                    key={scope}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="h-4 w-4 rounded border-[var(--studio-border)] accent-[var(--studio-accent)]"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      {scope}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewKeyName("");
                  setSelectedScopes(["read"]);
                }}
                className="rounded-lg bg-[var(--bg-elevated)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="mt-6 space-y-2">
        {loading ? (
          <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Loading keys...
            </p>
          </div>
        ) : keys.length === 0 ? (
          <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No API keys yet. Create one to get started.
            </p>
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {key.name}
                    </span>
                    <code className="font-mono text-xs text-[var(--text-muted)]">
                      {key.keyPreview}
                    </code>
                    <div className="flex gap-1">
                      {key.scopes.map((scope) => (
                        <ScopeBadge key={scope} scope={scope} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Created {formatDate(key.createdAt)}
                    {" \u00b7 "}
                    {key.lastUsedAt
                      ? `Last used ${formatDate(key.lastUsedAt)}`
                      : "Never used"}
                  </p>
                </div>
                <div>
                  {revokeConfirmId === key.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">
                        Revoke {key.name}? This cannot be undone.
                      </span>
                      <button
                        onClick={() => void handleRevoke(key.id)}
                        disabled={revoking}
                        className="text-xs font-medium text-red-400 transition-colors hover:text-red-300 disabled:opacity-50"
                      >
                        {revoking ? "Revoking..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setRevokeConfirmId(null)}
                        className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevokeConfirmId(key.id)}
                      className="text-xs text-red-400 transition-colors hover:text-red-300"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
