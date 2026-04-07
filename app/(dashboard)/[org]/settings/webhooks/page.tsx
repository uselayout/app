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

  const [githubToken, setGithubToken] = useState("");
  const [githubOwner, setGithubOwner] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubSaving, setGithubSaving] = useState(false);
  const [githubSaved, setGithubSaved] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

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

  const handleSaveGithub = useCallback(async () => {
    if (!currentOrg || !githubOwner.trim() || !githubRepo.trim()) return;
    setGithubSaving(true);
    setGithubError(null);
    try {
      const res = await fetch(`/api/organizations/${currentOrg.id}/webhook-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          passcode: githubToken.trim() || undefined,
          github_owner: githubOwner.trim(),
          github_repo: githubRepo.trim(),
          github_branch: githubBranch.trim() || "main",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(body.error ?? "Failed to save");
      }
      setGithubSaved(true);
      setTimeout(() => setGithubSaved(false), 3000);
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGithubSaving(false);
    }
  }, [currentOrg, githubToken, githubOwner, githubRepo, githubBranch]);

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

  const githubWebhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/github`
    : "/api/webhooks/github";

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
        Connect Figma and GitHub to automatically sync design and code changes.
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

        {/* GitHub Connection */}
        <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            GitHub Connection
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Connect a GitHub repository to scan for existing components and Storybook stories.
          </p>

          <div className="mt-5 space-y-4">
            {/* GitHub PAT */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                GitHub Personal Access Token
              </label>
              <input
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..."
                className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Generate at github.com/settings/tokens. Needs <code>repo</code> scope for private repos.
              </p>
            </div>

            {/* Repository */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Owner
                </label>
                <input
                  type="text"
                  value={githubOwner}
                  onChange={(e) => setGithubOwner(e.target.value)}
                  placeholder="acme"
                  className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Repository
                </label>
                <input
                  type="text"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  placeholder="web-app"
                  className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                />
              </div>
            </div>

            {/* Branch */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Branch
              </label>
              <input
                type="text"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
                placeholder="main"
                className="w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              />
            </div>

            {/* Webhook endpoint for GitHub */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                GitHub Webhook URL (optional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={githubWebhookUrl}
                  className="flex-1 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(githubWebhookUrl)}
                  className="rounded-lg border border-[var(--studio-border)] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Add this as a webhook in your GitHub repo settings to auto-scan on push.
              </p>
            </div>
          </div>
        </div>

        {/* GitHub Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveGithub}
            disabled={githubSaving || !githubOwner.trim() || !githubRepo.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {githubSaving && <Loader2 size={14} className="animate-spin" />}
            {githubSaving ? "Saving..." : "Save GitHub Configuration"}
          </button>

          {githubSaved && (
            <span className="text-xs text-emerald-400">Saved successfully</span>
          )}

          {githubError && (
            <span className="text-xs text-red-400">{githubError}</span>
          )}
        </div>
      </div>
    </div>
  );
}
