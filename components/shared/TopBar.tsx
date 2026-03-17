"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, ArrowUpToLine, PanelLeft, KeyRound } from "lucide-react";
import { useApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { PushToDesignSystemModal } from "@/components/studio/PushToDesignSystemModal";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import type { Project, SourceType } from "@/lib/types";

interface TopBarProps {
  projectName: string;
  sourceType: SourceType;
  sourceName?: string;
  project?: Project;
  onNameChange?: (name: string) => void;
  onReExtract?: () => void;
  onToggleSource?: () => void;
  sourcePanelOpen?: boolean;
  onExport?: () => void;
  centreView?: "editor" | "canvas";
  onCentreViewChange?: (view: "editor" | "canvas") => void;
}

export function TopBar({
  projectName,
  sourceType,
  sourceName,
  project: projectProp,
  onNameChange,
  onReExtract,
  onToggleSource,
  sourcePanelOpen,
  onExport,
  centreView = "editor",
  onCentreViewChange,
}: TopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const { key: apiKey } = useApiKey();
  const inputRef = useRef<HTMLInputElement>(null);
  const currentProjectId = useProjectStore((s) => s.currentProjectId);
  const projects = useProjectStore((s) => s.projects);
  const storeProject = projects.find((p) => p.id === currentProjectId);
  const currentProject = projectProp ?? storeProject;
  const orgId = useOrgStore((s) => s.currentOrgId);
  const tokens = currentProject?.extractionData?.tokens;
  const hasTokens = tokens
    ? tokens.colors.length > 0 ||
      tokens.typography.length > 0 ||
      tokens.spacing.length > 0 ||
      tokens.radius.length > 0 ||
      tokens.effects.length > 0
    : false;
  const hasPushableData = !!(
    hasTokens ||
    currentProject?.explorations?.length
  );

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
      {/* Left: Source panel toggle + Editor/Canvas toggle */}
      <div className="flex items-center gap-[17px]">
        <button
          onClick={onToggleSource}
          className={`flex items-center justify-center size-7 rounded-[4px] border border-[#24282c] transition-colors ${
            sourcePanelOpen
              ? "bg-[rgba(255,255,255,0.1)] text-white"
              : "bg-[rgba(255,255,255,0.02)] text-[#e8e8f0] hover:bg-[rgba(255,255,255,0.06)]"
          }`}
          title="Toggle source panel"
        >
          <PanelLeft className="h-3.5 w-3.5" />
        </button>

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
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="h-7 rounded-sm border border-[rgba(255,255,255,0.22)] bg-[#1A1A20] px-2 text-sm text-[#e8e8f0] outline-none focus:border-[var(--studio-border-focus)]"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[14px] font-medium text-[#e8e8f0] transition-colors hover:text-white"
          >
            {projectName}
          </button>
        )}

        <span className="inline-flex items-center gap-1.5 rounded-full border border-transparent px-[9px] py-[3px] text-[12px] font-medium text-[#e8e8f0] overflow-hidden">
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
        {hasPushableData && orgId && (
          <button
            onClick={() => setShowPushModal(true)}
            className="flex items-center gap-1.5 h-7 px-3 rounded-[4px] border border-[var(--studio-accent)] text-[12px] font-medium text-[var(--studio-accent)] hover:bg-[var(--studio-accent-subtle)] transition-colors"
            title="Push to design system"
          >
            <ArrowUpToLine className="h-3.5 w-3.5" />
            Push
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
      </div>

      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
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
