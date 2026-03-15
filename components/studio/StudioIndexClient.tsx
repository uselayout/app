"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import { useSession } from "@/lib/auth-client";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { detectSourceType } from "@/lib/util/detect-source";
import type { SourceType } from "@/lib/types";
import {
  Globe,
  ArrowRight,
  Clock,
  Trash2,
  Plus,
  X,
  Layers,
} from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}

export function StudioIndexClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const projects = useProjectStore((s) => s.projects);
  const createProject = useProjectStore((s) => s.createProject);
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const sortedProjects = [...projects].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const [showNewExtraction, setShowNewExtraction] = useState(false);
  const [url, setUrl] = useState("");
  const [pat, setPat] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const sourceType: SourceType | null = detectSourceType(url);
  const isFigma = sourceType === "figma";
  const isValid = sourceType !== null && (!isFigma || pat.trim().length > 0);

  const handleExtract = useCallback(() => {
    if (!isValid || isExtracting) return;

    if (!getStoredApiKey()) {
      setShowApiKeyModal(true);
      return;
    }

    setIsExtracting(true);

    const projectId =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    const projectName = isFigma
      ? "Figma Extraction"
      : new URL(url).hostname.replace("www.", "");

    createProject({
      id: projectId,
      orgId: currentOrgId ?? "",
      name: projectName,
      sourceType,
      sourceUrl: url,
      designMd: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isFigma && pat) {
      sessionStorage.setItem(`pat-${projectId}`, pat);
    }
    sessionStorage.setItem(`extract-${projectId}`, "true");

    router.push(`/studio/${projectId}`);
  }, [url, pat, isValid, isExtracting, isFigma, sourceType, createProject, router]);

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080705]">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-semibold text-white">
            Sign in to use Studio
          </h1>
          <p className="mb-6 text-sm text-[#99a1af]">
            Create an account to extract design systems and manage projects.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 h-[32px] px-[13px] rounded-[4px] bg-[#e6e6e6] text-[13px] font-medium text-[#08090a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity"
          >
            Sign in →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile gate */}
      <div className="flex md:hidden h-screen flex-col items-center justify-center px-6 text-center bg-[#080705]">
        <img src="/marketing/logo-white.svg" alt="Layout" width={100} height={24} className="mb-6" />
        <h2 className="text-lg font-semibold text-[--text-primary]">Desktop only</h2>
        <p className="mt-2 max-w-xs text-sm text-[--text-secondary]">
          Layout needs a larger screen to work properly. Please open this page on a desktop browser.
        </p>
        <a
          href="/"
          className="mt-6 rounded-md bg-[rgba(255,255,255,0.08)] px-4 py-2 text-sm font-medium text-[--text-primary] hover:bg-[rgba(255,255,255,0.12)] transition-colors"
        >
          Back to home
        </a>
      </div>
      {/* Desktop studio */}
      <div className="hidden md:block min-h-screen bg-[#080705] relative overflow-hidden">
        {/* Aurora background */}
        <img
          src="/marketing/aurora-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1456px] opacity-40 pointer-events-none select-none"
        />

        {/* Header */}
        <header className="relative z-10 border-b border-[rgba(255,255,255,0.08)] bg-[#080705]">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 h-[72px]">
            <Link href="/" className="flex-shrink-0">
              <img
                src="/marketing/logo-white.svg"
                alt="Layout"
                width={99}
                height={24}
              />
            </Link>
            <button
              onClick={() => setShowNewExtraction(true)}
              className="inline-flex items-center gap-2 h-[32px] pl-[9px] pr-[13px] rounded-[4px] bg-[#e6e6e6] border border-[#e6e6e6] text-[13px] font-normal text-[#08090a] shadow-[0px_8px_2px_0px_rgba(0,0,0,0),0px_5px_2px_0px_rgba(0,0,0,0.01),0px_3px_2px_0px_rgba(0,0,0,0.04),0px_1px_1px_0px_rgba(0,0,0,0.07),0px_0px_1px_0px_rgba(0,0,0,0.08)] hover:bg-[#d9d9d9] transition-colors"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[1280px] px-6 pt-[48px] pb-12">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[4px] border border-dashed border-[rgba(255,255,255,0.16)] py-20">
              <div className="mb-4 rounded-[4px] bg-[#282826] p-4">
                <Layers size={24} className="text-[#99a1af]" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-white">
                No projects yet
              </h2>
              <p className="mb-6 max-w-sm text-center text-sm text-[#99a1af]">
                Paste a Figma file URL or website URL to extract its design
                system and generate an AI-ready context bundle.
              </p>
              <button
                onClick={() => setShowNewExtraction(true)}
                className="inline-flex items-center gap-2 h-[32px] pl-[9px] pr-[13px] rounded-[4px] bg-[#e6e6e6] text-[13px] font-normal text-[#08090a] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:bg-[#d9d9d9] transition-colors"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedProjects.map((project) => {
                const hostname = project.sourceUrl
                  ? getHostname(project.sourceUrl)
                  : null;
                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/studio/${project.id}`)}
                    className="group relative text-left bg-[#282826] border border-[rgba(255,255,255,0.16)] rounded-[4px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_0px_rgba(0,0,0,0.1)] p-[21px] h-[128px] flex flex-col justify-between hover:border-[rgba(255,255,255,0.3)] transition-colors"
                  >
                    {/* Delete button */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          if (confirm(`Delete "${project.name}"?`)) {
                            deleteProject(project.id);
                          }
                        }
                      }}
                      className="absolute right-3 top-3 rounded p-1 text-[#99a1af] opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all cursor-pointer"
                      aria-label={`Delete ${project.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </div>

                    {/* Title + arrow */}
                    <div className="flex items-center justify-between gap-2 pr-4">
                      <p className="text-[16px] font-semibold leading-[22px] text-white truncate">
                        {project.name}
                      </p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#99a1af] group-hover:text-white transition-colors" />
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-[#010101] rounded-full h-[20px] px-2 text-[12px] text-[#99a1af]">
                          <Globe className="h-3 w-3" />
                          {project.sourceType === "figma" ? "Figma" : "Website"}
                        </span>
                        {hostname && (
                          <span className="text-[12px] text-[#99a1af] truncate max-w-[140px]">
                            {hostname}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[12px] text-[#99a1af]">
                        <Clock className="h-3 w-3" />
                        {timeAgo(project.updatedAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New extraction modal */}
      {showNewExtraction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
            onClick={() => setShowNewExtraction(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New extraction"
            className="relative z-10 w-full max-w-[399px] bg-[#282826] border border-[rgba(255,255,255,0.07)] rounded-[10px] shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)]"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between h-[69px] px-5 border-b border-[rgba(255,255,255,0.07)]">
              <div className="flex items-center gap-[10px]">
                <div className="flex items-center justify-center w-8 h-8">
                  <img
                    src="/marketing/logo-mark.svg"
                    alt=""
                    width={19}
                    height={19}
                    className="flex-shrink-0 brightness-0 invert"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold leading-[20px] text-[#ededf4]">
                    New Extraction
                  </span>
                  <span className="text-[12px] leading-[16px] text-[#99a1af]">
                    Extract a design system from any source
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowNewExtraction(false)}
                className="flex items-center justify-center w-7 h-7 rounded text-[#8a8f98] hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div className="flex flex-col gap-[10px] px-4 py-[26px]">
              <input
                type="url"
                placeholder="Paste a Figma or website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
                autoFocus
                className="w-full h-[40px] bg-[#010101] border border-[rgba(255,255,255,0.07)] rounded-[6px] px-3 text-[12px] text-[#ededf4] placeholder:text-[rgba(237,237,244,0.5)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
              />

              {isFigma && (
                <input
                  type="password"
                  placeholder="Figma Personal Access Token (figd_...)"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
                  className="w-full h-[40px] bg-[#010101] border border-[rgba(255,255,255,0.07)] rounded-[6px] px-3 text-[12px] text-[#ededf4] placeholder:text-[rgba(237,237,244,0.5)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
                />
              )}

              {sourceType && (
                <div className="flex items-center gap-2 text-[12px] text-[#99a1af]">
                  <span className="inline-flex items-center gap-1 bg-[#010101] rounded-full h-[20px] px-2 text-[12px] text-[#99a1af]">
                    {isFigma ? (
                      <Layers className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    {isFigma ? "Figma" : "Website"}
                  </span>
                  detected
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-[rgba(255,255,255,0.07)] px-4 py-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowNewExtraction(false)}
                className="h-[32px] px-3 rounded-[4px] text-[12px] text-[#99a1af] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={!isValid || isExtracting}
                className="h-[32px] px-4 rounded-[4px] bg-[#3c3c3c] border border-[#4a4343] text-[12px] font-medium text-white hover:bg-[#444] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isExtracting ? "Starting..." : "Extract →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          onClose={() => {
            setShowApiKeyModal(false);
            if (getStoredApiKey()) {
              handleExtract();
            } else {
              setShowNewExtraction(true);
            }
          }}
        />
      )}
    </>
  );
}
