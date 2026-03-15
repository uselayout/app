"use client";

import { useState, useEffect } from "react";
import { X, Key, ExternalLink } from "lucide-react";
import { useApiKey, useGoogleApiKey } from "@/lib/hooks/use-api-key";

interface ApiKeyModalProps {
  onClose: () => void;
}

function KeyField({
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
        <label className="text-xs font-medium text-[--text-muted]">
          {label}
        </label>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-[--text-muted] hover:text-[--studio-accent] transition-colors"
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
            className="w-full rounded-md border border-[--studio-border-strong] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus]"
          />
          <button
            onClick={handleSave}
            disabled={!draft.trim() || draft.startsWith("•")}
            className="shrink-0 rounded-md bg-[--studio-accent] px-3 py-2 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] disabled:opacity-40 transition-colors"
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-md border border-[--studio-border] bg-[--bg-surface] px-3 py-2">
          <span className="text-xs text-[--text-secondary]">
            ••••••••••••••••
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs text-[--text-muted] hover:text-[--status-error] transition-colors"
            >
              Clear
            </button>
            <button
              onClick={handleEdit}
              className="text-xs text-[--studio-accent] hover:underline"
            >
              Change
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const anthropic = useApiKey();
  const google = useGoogleApiKey();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-[--studio-border-strong] bg-[--bg-elevated] p-6 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-[--studio-accent]" />
            <h2 className="text-sm font-semibold text-[--text-primary]">
              API Keys
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[--text-muted] hover:text-[--text-primary] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-xs leading-relaxed text-[--text-secondary]">
          Your keys are stored locally in your browser. We never persist them on
          our servers.
        </p>

        <div className="space-y-4">
          <KeyField
            label="Anthropic API Key"
            placeholder="sk-ant-api03-..."
            externalUrl="https://console.anthropic.com/settings/keys"
            externalLabel="Get key"
            storedKey={anthropic.key}
            onSave={anthropic.setKey}
            onClear={anthropic.clearKey}
          />

          <KeyField
            label="Google AI API Key"
            placeholder="AIza..."
            externalUrl="https://aistudio.google.com/apikey"
            externalLabel="Get key"
            storedKey={google.key}
            onSave={google.setKey}
            onClear={google.clearKey}
          />
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-[--studio-accent] px-3 py-1.5 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
