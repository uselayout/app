"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Globe, RefreshCw, FlaskConical, Download, LogOut, KeyRound, ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { useProjectStore } from "@/lib/store/project";
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
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const { key: apiKey } = useApiKey();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  // Close project menu on outside click
  useEffect(() => {
    if (!showProjectMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProjectMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showProjectMenu]);

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

      {/* Centre: Project name + switcher + status */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={menuRef}>
          <div className="flex items-center gap-1">
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
            {projects.length > 1 && !isEditing && (
              <button
                onClick={() => setShowProjectMenu((v) => !v)}
                className="rounded p-0.5 text-[--text-muted] hover:text-[--text-primary] hover:bg-[--bg-hover] transition-colors"
                aria-label="Switch project"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Project switcher dropdown */}
          {showProjectMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-lg border border-[--studio-border-strong] bg-[--bg-elevated] shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-[--studio-border]">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[--text-muted]">
                  Switch project
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {[...projects]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`group flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                        p.id === currentProjectId
                          ? "bg-[--studio-accent-subtle]"
                          : "hover:bg-[--bg-hover]"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setShowProjectMenu(false);
                          router.push(`/studio/${p.id}`);
                        }}
                        className="flex-1 min-w-0"
                      >
                        <p className={`text-xs font-medium truncate ${
                          p.id === currentProjectId
                            ? "text-[--studio-accent]"
                            : "text-[--text-primary]"
                        }`}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-[--text-muted] flex items-center gap-1.5">
                          {p.sourceType === "figma" ? (
                            <Layers className="h-2.5 w-2.5" />
                          ) : (
                            <Globe className="h-2.5 w-2.5" />
                          )}
                          {p.sourceUrl ? new URL(p.sourceUrl).hostname.replace("www.", "") : p.sourceType}
                        </p>
                      </button>
                      {p.id !== currentProjectId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete "${p.name}"?`)) {
                              deleteProject(p.id);
                            }
                          }}
                          className="rounded p-1 text-[--text-muted] opacity-0 group-hover:opacity-100 hover:bg-[--bg-surface] hover:text-red-400 transition-all"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
              <div className="border-t border-[--studio-border] px-3 py-2">
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    router.push("/");
                  }}
                  className="text-[10px] text-[--text-muted] hover:text-[--studio-accent] transition-colors"
                >
                  ← Back to homepage
                </button>
              </div>
            </div>
          )}
        </div>

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
