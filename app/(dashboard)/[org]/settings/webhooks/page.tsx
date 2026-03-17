"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { Loader2 } from "lucide-react";

export default function WebhooksPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const currentOrg = useOrgStore((s) => s.currentOrg)();

  const [passcode, setPasscode] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate a random passcode
  const generatePasscode = useCallback(() => {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const code = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
    setPasscode(code);
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentOrg || !passcode.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/organizations/${currentOrg.id}/webhook-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "figma",
          passcode: passcode.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(body.error ?? "Failed to save webhook configuration");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }, [currentOrg, passcode]);

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  const endpointUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/figma`
    : "/api/webhooks/figma";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-1">
        <a
          href={`/${orgSlug}/settings`}
          className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          &larr; Settings
        </a>
      </div>

      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Webhooks
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Connect Figma to automatically sync design changes.
      </p>

      {/* Figma Webhook Setup */}
      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Figma Webhook
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            When a designer publishes changes in Figma, Layout will re-extract tokens automatically.
          </p>

          <div className="mt-5 space-y-4">
            {/* Endpoint URL */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Webhook Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={endpointUrl}
                  className="flex-1 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(endpointUrl)}
                  className="rounded-lg border border-[var(--studio-border)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Paste this URL in Figma &rarr; Admin &rarr; Webhooks
              </p>
            </div>

            {/* Passcode */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Passcode
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter or generate a passcode"
                  className="flex-1 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                />
                <button
                  onClick={generatePasscode}
                  className="rounded-lg border border-[var(--studio-border)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Must match the passcode in your Figma webhook configuration
              </p>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !passcode.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving..." : "Save Configuration"}
          </button>

          {saved && (
            <span className="text-xs text-emerald-400">Saved successfully</span>
          )}

          {error && (
            <span className="text-xs text-red-400">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
