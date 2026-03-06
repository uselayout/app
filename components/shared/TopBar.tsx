"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Globe, RefreshCw, FlaskConical, Download, LogOut, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import type { SourceType } from "@/lib/types";

interface TopBarProps {
  projectName: string;
  sourceType: SourceType;
  sourceName?: string;
  lastSaved?: string;
  onNameChange?: (name: string) => void;
  onReExtract?: () => void;
  onTest?: () => void;
  onExport?: () => void;
}

export function TopBar({
  projectName,
  sourceType,
  sourceName,
  lastSaved,
  onNameChange,
  onReExtract,
  onTest,
  onExport,
}: TopBarProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { key: apiKey } = useApiKey();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== projectName) {
      onNameChange?.(editValue.trim());
    } else {
      setEditValue(projectName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(projectName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex h-12 items-center justify-between border-b border-[--studio-border] bg-[--bg-panel] px-4">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[--text-muted]">
          <Layers className="h-4 w-4 text-[--studio-accent]" />
          <span className="text-xs font-medium tracking-wide uppercase">
            Studio
          </span>
        </div>
      </div>

      {/* Centre: Project name + status */}
      <div className="flex items-center gap-3">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-7 rounded-sm border border-[--studio-border-strong] bg-[--bg-surface] px-2 text-sm text-[--text-primary] outline-none focus:border-[--studio-border-focus]"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-[--text-primary] transition-colors hover:text-[--studio-accent]"
          >
            {projectName}
          </button>
        )}

        <span className="text-xs text-[--text-muted]">
          {lastSaved ? `Saved ${lastSaved}` : ""}
        </span>

        <Badge
          variant="secondary"
          className="gap-1 bg-[--bg-surface] text-[--text-secondary]"
        >
          {sourceType === "figma" ? (
            <Layers className="h-3 w-3" />
          ) : (
            <Globe className="h-3 w-3" />
          )}
          {sourceName || sourceType}
        </Badge>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReExtract}
          className="h-8 gap-1.5 text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Re-extract
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onTest}
          className="h-8 gap-1.5 text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          Test
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          className="h-8 gap-1.5 text-xs text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <div className="ml-1 h-4 w-px bg-[--studio-border]" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowApiKeyModal(true)}
          className="relative h-8 gap-1.5 text-xs text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary]"
          title="API Key settings"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {apiKey && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="h-8 gap-1.5 text-xs text-[--text-muted] hover:bg-[--bg-hover] hover:text-[--text-primary]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}
    </div>
  );
}
