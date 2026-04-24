"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { useOrgStore } from "@/lib/store/organization";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";
import { useApiKey, useGoogleApiKey, useOpenAIKey, useFigmaApiKey } from "@/lib/hooks/use-api-key";

// ---------------------------------------------------------------------------
// Personal key field (localStorage, never sent to server)
// ---------------------------------------------------------------------------

function PersonalKeyField({
  label,
  placeholder,
  externalUrl,
  externalLabel,
  storedKey,
  onSave,
  onClear,
}: {
  label: string;
  placeholder: string;
  externalUrl: string;
  externalLabel: string;
  storedKey: string;
  onSave: (key: string) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState(storedKey ? "••••••••••••••••" : "");
  const [isEditing, setIsEditing] = useState(!storedKey);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed.startsWith("•")) return;
    onSave(trimmed);
    setDraft("••••••••••••••••");
    setIsEditing(false);
  };

  const handleClear = () => {
    onClear();
    setDraft("");
    setIsEditing(true);
  };

  const handleEdit = () => {
    setDraft("");
    setIsEditing(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-secondary)]">
          {label}
        </label>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--studio-accent)] transition-colors"
        >
          {externalLabel}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="password"
            placeholder={placeholder}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full rounded-md border border-[var(--studio-border-strong)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)]"
          />
          <button
            onClick={handleSave}
            disabled={!draft.trim() || draft.startsWith("•")}
            className="shrink-0 rounded-md bg-[var(--studio-accent)] px-3 py-2 text-xs font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
          <span className="text-xs text-[var(--text-secondary)]">
            ••••••••••••••••
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--status-error)] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleEdit}
              className="text-xs text-[var(--studio-accent)] hover:underline"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiKeysPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const currentOrg = useOrgStore((s) => s.currentOrg)();
  const hasPermission = useOrgStore((s) => s.hasPermission);

  const anthropic = useApiKey();
  const google = useGoogleApiKey();
  const openai = useOpenAIKey();
  const figma = useFigmaApiKey();

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

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

      {/* Personal keys — localStorage, never sent to server */}
      <div className="mt-4">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Your Keys
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Stored locally in your browser. We never persist them on our servers.{" "}
          <a
            href="/docs/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] hover:text-[var(--studio-accent)] underline transition-colors"
          >
            Learn more
          </a>
        </p>

        <div className="mt-6 space-y-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
          <PersonalKeyField
            label="Anthropic API Key"
            placeholder="sk-ant-api03-..."
            externalUrl="https://console.anthropic.com/settings/keys"
            externalLabel="Get key"
            storedKey={anthropic.key}
            onSave={anthropic.setKey}
            onClear={anthropic.clearKey}
          />

          <PersonalKeyField
            label="Google AI API Key"
            placeholder="AIza..."
            externalUrl="https://aistudio.google.com/apikey"
            externalLabel="Get key"
            storedKey={google.key}
            onSave={google.setKey}
            onClear={google.clearKey}
          />

          <PersonalKeyField
            label="OpenAI API Key"
            placeholder="sk-proj-..."
            externalUrl="https://platform.openai.com/api-keys"
            externalLabel="Get key"
            storedKey={openai.key}
            onSave={openai.setKey}
            onClear={openai.clearKey}
          />

          <PersonalKeyField
            label="Figma Personal Access Token"
            placeholder="figd_..."
            externalUrl="https://www.figma.com/developers/api#access-tokens"
            externalLabel="Get token"
            storedKey={figma.key}
            onSave={figma.setKey}
            onClear={figma.clearKey}
          />
        </div>
      </div>

      {/* Org API keys — server-persisted, for programmatic access */}
      {hasPermission("manageApiKeys") && (
        <div className="mt-10">
          <ApiKeyManager orgId={currentOrg.id} />
        </div>
      )}
    </div>
  );
}
