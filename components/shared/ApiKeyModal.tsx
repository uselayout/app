"use client";

import { useState, useEffect } from "react";
import { X, Key, ExternalLink } from "lucide-react";
import { useApiKey } from "@/lib/hooks/use-api-key";

interface ApiKeyModalProps {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const { key, setKey, clearKey } = useApiKey();
  const [draft, setDraft] = useState(key ? "••••••••••••••••" : "");
  const [isEditing, setIsEditing] = useState(!key);

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

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed.startsWith("•")) return;
    setKey(trimmed);
    setDraft("••••••••••••••••");
    setIsEditing(false);
  };

  const handleClear = () => {
    clearKey();
    setDraft("");
    setIsEditing(true);
  };

  const handleEdit = () => {
    setDraft("");
    setIsEditing(true);
  };

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
              Anthropic API Key
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[--text-muted] hover:text-[--text-primary] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[--text-secondary]">
          Your key is stored locally in your browser and sent directly to our
          server for Claude API calls. We never persist it.
        </p>

        <div className="mb-4 space-y-2">
          <label className="text-xs font-medium text-[--text-muted]">
            API Key
          </label>
          {isEditing ? (
            <input
              type="password"
              placeholder="sk-ant-api03-..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="w-full rounded-md border border-[--studio-border-strong] bg-[--bg-surface] px-3 py-2 text-xs text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus]"
            />
          ) : (
            <div className="flex items-center justify-between rounded-md border border-[--studio-border] bg-[--bg-surface] px-3 py-2">
              <span className="text-xs text-[--text-secondary]">
                ••••••••••••••••
              </span>
              <button
                onClick={handleEdit}
                className="text-xs text-[--studio-accent] hover:underline"
              >
                Change
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[--text-muted] hover:text-[--studio-accent] transition-colors"
          >
            Get an API key
            <ExternalLink className="h-3 w-3" />
          </a>

          <div className="flex items-center gap-2">
            {key && (
              <button
                onClick={handleClear}
                className="rounded-md px-3 py-1.5 text-xs text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--status-error] transition-colors"
              >
                Clear
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={!draft.trim() || draft.startsWith("•")}
                className="rounded-md bg-[--studio-accent] px-3 py-1.5 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] disabled:opacity-40 transition-colors"
              >
                Save key
              </button>
            )}
            {!isEditing && (
              <button
                onClick={onClose}
                className="rounded-md bg-[--studio-accent] px-3 py-1.5 text-xs font-medium text-[--text-on-accent] hover:bg-[--studio-accent-hover] transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
