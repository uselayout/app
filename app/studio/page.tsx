"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { useSession } from "@/lib/auth-client";
import { getStoredApiKey } from "@/lib/hooks/use-api-key";
import { ApiKeyModal } from "@/components/shared/ApiKeyModal";
import { detectSourceType } from "@/lib/util/detect-source";
import type { SourceType } from "@/lib/types";
import {
  Layers,
  Globe,
  ArrowRight,
  Clock,
  Trash2,
  Plus,
  X,
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

export default function StudioIndexPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const projects = useProjectStore((s) => s.projects);
  const createProject = useProjectStore((s) => s.createProject);
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="mb-3 text-2xl font-bold text-[#0a0a0a]">
            Sign in to use Studio
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Create an account to extract design systems and manage projects.
          </p>
          <a
            href="/login"
            className="rounded-full bg-[#0a0a0a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
          >
            Sign in →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#fafafa]">
        {/* Header */}
        <header className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
            <div>
              <h1 className="text-xl font-bold text-[#0a0a0a]">Studio</h1>
              <p className="text-sm text-gray-500">
                {projects.length === 0
                  ? "Extract your first design system"
                  : `${projects.length} project${projects.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              onClick={() => setShowNewExtraction(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
            >
              <Plus size={16} />
              New extraction
            </button>
          </div>
        </header>

        {/* Projects grid */}
        <div className="mx-auto max-w-5xl px-6 py-8">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-20">
              <div className="mb-4 rounded-xl bg-gray-100 p-4">
                <Layers size={24} className="text-gray-400" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                No projects yet
              </h2>
              <p className="mb-6 max-w-sm text-center text-sm text-gray-500">
                Paste a Figma file URL or website URL to extract its design
                system and generate an AI-ready context bundle.
              </p>
              <button
                onClick={() => setShowNewExtraction(true)}
                className="rounded-full bg-[#0a0a0a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
              >
                New extraction →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((project) => {
                const hostname = project.sourceUrl
                  ? getHostname(project.sourceUrl)
                  : null;
                const score = project.healthScore;
                const scoreColour =
                  score == null
                    ? ""
                    : score >= 80
                      ? "bg-emerald-500"
                      : score >= 50
                        ? "bg-amber-400"
                        : "bg-red-400";
                return (
                  <div
                    key={project.id}
                    className="group relative rounded-2xl border border-black/[0.08] bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${project.name}"?`)) {
                          deleteProject(project.id);
                        }
                      }}
                      className="absolute right-3 top-3 rounded-md p-1.5 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                      aria-label={`Delete ${project.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => router.push(`/studio/${project.id}`)}
                      className="w-full text-left"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2 pr-6">
                        <p className="font-semibold text-[#0a0a0a] leading-snug line-clamp-1">
                          {project.name}
                        </p>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-500 transition-colors mt-0.5" />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {project.sourceType === "figma" ? (
                            <Layers className="h-3 w-3" />
                          ) : (
                            <Globe className="h-3 w-3" />
                          )}
                          {project.sourceType === "figma" ? "Figma" : "Website"}
                        </span>
                        {hostname && (
                          <span className="text-xs text-gray-400 truncate max-w-[140px]">
                            {hostname}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(project.updatedAt)}
                        </span>
                        {score != null && (
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${scoreColour}`}
                            />
                            {score}/100
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowNewExtraction(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New extraction"
            className="relative w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-scale-in"
          >
            <button
              onClick={() => setShowNewExtraction(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 className="mb-1 text-xl font-bold text-[#0a0a0a]">
              New extraction
            </h2>
            <p className="mb-6 text-sm text-gray-500">
              Paste a Figma file or website URL to extract its design system.
            </p>

            <div className="space-y-3">
              <input
                type="url"
                placeholder="Paste a Figma file URL or website URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoFocus
                className="h-13 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-base text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
              />

              {isFigma && (
                <input
                  type="password"
                  placeholder="Figma Personal Access Token (figd_...)"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  className="h-13 w-full rounded-xl border border-black/[0.08] bg-white px-4 text-base text-[#0a0a0a] placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-all"
                />
              )}

              {sourceType && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
                    {isFigma ? "Figma" : "Website"}
                  </span>
                  <span>detected</span>
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={!isValid || isExtracting}
                className="h-11 w-full rounded-xl bg-[#0a0a0a] text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isExtracting
                  ? "Starting extraction..."
                  : "Extract Design System →"}
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
