"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, LogOut, KeyRound, ChevronDown, Trash2, Plus, RefreshCw, FlaskConical, Layers, ArrowUpToLine } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { NewExtractionModal } from "@/components/studio/NewExtractionModal";
import { PushToDesignSystemModal } from "@/components/studio/PushToDesignSystemModal";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import type { SourceType } from "@/lib/types";

interface TopBarProps {
  projectName: string;
  sourceType: SourceType;
  sourceName?: string;
  lastSaved?: string;
  onNameChange?: (name: string) => void;
  onReExtract?: () => void;
  onTest?: () => void;
  testPanelOpen?: boolean;
  onExport?: () => void;
  centreView?: "editor" | "canvas";
  onCentreViewChange?: (view: "editor" | "canvas") => void;
}

export function TopBar({
  projectName,
  sourceType,
  sourceName,
  lastSaved: _lastSaved,
  onNameChange,
  onReExtract,
  onTest,
  testPanelOpen,
  onExport,
  centreView = "editor",
  onCentreViewChange,
}: TopBarProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showNewExtraction, setShowNewExtraction] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const { key: apiKey } = useApiKey();
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const projects = useProjectStore((s) => s.projects);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const orgId = useOrgStore((s) => s.currentOrgId);
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const hasPushableData = !!(
    currentProject?.extractionData?.tokens?.length ||
    currentProject?.testResults?.length ||
    currentProject?.explorations?.length
  );

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
    <div className="flex h-12 items-center justify-between border-b border-[rgba(255,255,255,0.07)] bg-[#0c0c0e] px-4">
      {/* Left: Logo + New + Editor/Canvas toggle */}
      <div className="flex items-center gap-[17px]">
        <div className="flex items-center gap-[17px]">
          <Link
            href="/studio"
            className="flex items-center shrink-0"
            title="Back to projects"
          >
            <img
              src="/marketing/logo-white.svg"
              alt="Layout"
              width={80}
              height={19}
            />
          </Link>
          <button
            onClick={() => setShowNewExtraction(true)}
            className="flex items-center gap-1 h-6 px-[9px] rounded-[4px] border border-[#24282c] text-[12px] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            title="New extraction"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Editor / Canvas toggle */}
        {onCentreViewChange && (
          <div className="flex items-center">
            <button
              onClick={() => onCentreViewChange("editor")}
              className={`flex items-center h-7 px-[11px] rounded-l-[4px] border text-[12px] font-medium transition-colors ${
                centreView === "editor"
                  ? "bg-white border-white text-[#0c0c0e]"
                  : "bg-transparent border-[#24282c] text-[#e8e8f0]"
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => onCentreViewChange("canvas")}
              className={`flex items-center h-7 px-[11px] rounded-r-[4px] border-y border-r text-[12px] font-medium transition-colors ${
                centreView === "canvas"
                  ? "bg-white border-white text-[#0c0c0e]"
                  : "bg-transparent border-[#24282c] text-[#e8e8f0]"
              }`}
            >
              Canvas
            </button>
          </div>
        )}
      </div>

      {/* Centre: Project name + source badge */}
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
                className="h-7 rounded-sm border border-[rgba(255,255,255,0.22)] bg-[#1A1A20] px-2 text-sm text-[#e8e8f0] outline-none focus:border-[--studio-border-focus]"
              />
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-[14px] font-medium text-[#e8e8f0] transition-colors hover:text-white"
              >
                {projectName}
              </button>
            )}
            {projects.length > 1 && !isEditing && (
              <button
                onClick={() => setShowProjectMenu((v) => !v)}
                className="rounded-[4px] p-0.5 text-[#e8e8f0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                aria-label="Switch project"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Project switcher dropdown */}
          {showProjectMenu && (
            <>
            <div className="fixed inset-0 z-40" onClick={() => setShowProjectMenu(false)} />
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-lg border border-[rgba(255,255,255,0.22)] bg-[#222228] shadow-xl overflow-hidden z-50">
              <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.12)]">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[rgba(237,237,244,0.5)]">
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
                          ? "bg-[--studio-accent]/10"
                          : "hover:bg-[#2A2A32]"
                      }`}
                    >
                      <button
                        onClick={() => {
                          setShowProjectMenu(false);
                          router.push(`/studio/${p.id}`);
                        }}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className={`text-xs font-medium truncate ${
                          p.id === currentProjectId
                            ? "text-[--studio-accent]"
                            : "text-[#EDEDF4]"
                        }`}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-[rgba(237,237,244,0.5)] flex items-center gap-1.5">
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
                          className="rounded p-1 text-[rgba(237,237,244,0.5)] opacity-0 group-hover:opacity-100 hover:bg-[#1A1A20] hover:text-red-400 transition-all"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
              <div className="border-t border-[rgba(255,255,255,0.12)] px-3 py-2 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    router.push("/studio");
                  }}
                  className="text-[10px] text-[rgba(237,237,244,0.5)] hover:text-[--studio-accent] transition-colors"
                >
                  ← All projects
                </button>
                <button
                  onClick={() => {
                    setShowProjectMenu(false);
                    setShowNewExtraction(true);
                  }}
                  className="flex items-center gap-1 text-[10px] text-[rgba(237,237,244,0.5)] hover:text-[--studio-accent] transition-colors"
                >
                  <Plus className="h-2.5 w-2.5" />
                  New extraction
                </button>
              </div>
            </div>
            </>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-[9px] py-[3px] text-[12px] font-medium text-[#e8e8f0] overflow-hidden">
          <Globe className="h-3 w-3" />
          {sourceName || sourceType}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onReExtract}
          className="flex items-center justify-center size-7 rounded-[4px] border border-[#24282c] bg-[rgba(255,255,255,0.02)] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          title="Re-extract"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onTest}
          className={`flex items-center justify-center size-7 rounded-[4px] border border-[#24282c] transition-colors ${
            testPanelOpen
              ? "bg-[rgba(255,255,255,0.1)] text-white"
              : "bg-[rgba(255,255,255,0.02)] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)]"
          }`}
          title="Toggle test panel"
        >
          <FlaskConical className="h-3.5 w-3.5" />
        </button>
        {hasPushableData && orgId && (
          <button
            onClick={() => setShowPushModal(true)}
            className="flex items-center gap-1 h-7 px-[9px] rounded-[4px] border border-[#24282c] text-[12px] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            title="Push to design system"
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Push</span>
          </button>
        )}
        <button
          onClick={onExport}
          className="flex items-center justify-center h-7 px-[13px] rounded-[4px] bg-[#e6e6e6] border border-[#e6e6e6] text-[12px] font-medium text-[#08090a] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:bg-[#d9d9d9] transition-colors"
        >
          Export
        </button>
        <button
          onClick={() => setShowApiKeyModal(true)}
          className="relative flex items-center justify-center size-7 rounded-[4px] border border-[#24282c] bg-[rgba(255,255,255,0.02)] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          title="API Key settings"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {apiKey && (
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
          )}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-[4px] text-[12px] font-medium text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}
      {showNewExtraction && (
        <NewExtractionModal onClose={() => setShowNewExtraction(false)} />
      )}
      {showPushModal && currentProject && orgId && (
        <PushToDesignSystemModal
          project={currentProject}
          orgId={orgId}
          onClose={() => setShowPushModal(false)}
        />
      )}
    </div>
  );
}
