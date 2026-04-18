"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Layers, Globe, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import { detectSourceType, normaliseUrl } from "@/lib/util/detect-source";
import { getStoredFigmaApiKey, markKeySet } from "@/lib/hooks/use-api-key";
import {
  BLANK_LAYOUT_MD_TEMPLATE,
  createBlankExtractionResult,
} from "@/lib/util/blank-project";

interface NewExtractionModalProps {
  onClose: () => void;
}

type Mode = "extract" | "blank";

export function NewExtractionModal({ onClose }: NewExtractionModalProps) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const createProjectAsync = useProjectStore((s) => s.createProjectAsync);
  const currentOrgId = useOrgStore((s) => s.currentOrgId);

  const [mode, setMode] = useState<Mode>("extract");
  const [url, setUrl] = useState("");
  const [blankName, setBlankName] = useState("Untitled design system");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const storedFigmaPat = getStoredFigmaApiKey();
  const [pat, setPat] = useState(storedFigmaPat);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const QUICK_START_EXAMPLES = [
    { label: "Try Stripe →", url: "https://stripe.com" },
    { label: "Try Linear →", url: "https://linear.app" },
    { label: "Try Vercel →", url: "https://vercel.com" },
  ];

  const sourceType = url ? detectSourceType(url) : null;
  const isFigma = sourceType === "figma";
  const isExtractValid = sourceType !== null && (!isFigma || pat.length > 0);
  const isBlankValid = blankName.trim().length > 0;

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

  useEffect(() => {
    if (mode === "blank") {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    } else {
      urlInputRef.current?.focus();
    }
  }, [mode]);

  const handleExtract = useCallback(async () => {
    if (!isExtractValid || !sourceType || !currentOrgId || saving) return;

    setSaving(true);
    setSaveError(null);

    const fullUrl = normaliseUrl(url);
    const projectId =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    const projectName = isFigma
      ? "Figma Extraction"
      : new URL(fullUrl).hostname.replace("www.", "");

    const error = await createProjectAsync({
      id: projectId,
      orgId: currentOrgId,
      name: projectName,
      sourceType,
      sourceUrl: fullUrl,
      layoutMd: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      setSaving(false);
      setSaveError("Failed to create project. Please try again.");
      return;
    }

    if (isFigma && pat) {
      sessionStorage.setItem(`pat-${projectId}`, pat);
      localStorage.setItem("sd_figma_pat", pat);
      markKeySet("figma");
    }
    sessionStorage.setItem(`extract-${projectId}`, "true");

    router.push(`/${orgSlug}/projects/${projectId}/studio`);
  }, [
    isExtractValid,
    sourceType,
    currentOrgId,
    saving,
    url,
    isFigma,
    pat,
    createProjectAsync,
    orgSlug,
    router,
  ]);

  const handleStartBlank = useCallback(async () => {
    if (!isBlankValid || !currentOrgId || saving) return;

    setSaving(true);
    setSaveError(null);

    const projectId =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);

    const error = await createProjectAsync({
      id: projectId,
      orgId: currentOrgId,
      name: blankName.trim(),
      sourceType: "manual",
      layoutMd: BLANK_LAYOUT_MD_TEMPLATE,
      extractionData: createBlankExtractionResult(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      setSaving(false);
      setSaveError("Failed to create project. Please try again.");
      return;
    }

    // Deliberately no `extract-${projectId}` flag — blank projects skip extraction.
    router.push(`/${orgSlug}/projects/${projectId}/studio`);
  }, [
    isBlankValid,
    blankName,
    currentOrgId,
    saving,
    createProjectAsync,
    orgSlug,
    router,
  ]);

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? "bg-[var(--studio-border)] text-[var(--text-primary)]"
        : "text-[var(--text-muted)] hover:bg-[var(--studio-accent-subtle)] hover:text-[var(--text-secondary)]"
    }`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] p-6 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              New Project
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {mode === "extract"
                ? "Paste a Figma or website URL to extract a design system"
                : "Start with an empty kit and build the design system from scratch"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="mb-4 flex gap-1 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-app)] p-1">
          <button
            type="button"
            onClick={() => setMode("extract")}
            className={tabClass(mode === "extract")}
          >
            Extract from URL
          </button>
          <button
            type="button"
            onClick={() => setMode("blank")}
            className={tabClass(mode === "blank")}
          >
            Start blank
          </button>
        </div>

        {mode === "extract" ? (
          <div className="space-y-3">
            <div className="relative">
              <input
                ref={urlInputRef}
                type="url"
                placeholder="https://figma.com/design/... or https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && isExtractValid && handleExtract()
                }
                className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-4 py-3 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
              />
              {sourceType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFigma ? (
                    <Layers className="h-4 w-4 text-[var(--studio-accent)]" />
                  ) : (
                    <Globe className="h-4 w-4 text-[var(--status-success)]" />
                  )}
                </div>
              )}
            </div>

            {!url && (
              <div>
                <p className="my-2 text-center text-xs text-[var(--text-muted)]">
                  — or try with an example —
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_START_EXAMPLES.map((example) => (
                    <button
                      key={example.url}
                      type="button"
                      onClick={() => {
                        setUrl(example.url);
                        urlInputRef.current?.focus();
                      }}
                      className="duration-[var(--duration-base)] cursor-pointer rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isFigma && !storedFigmaPat && (
              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="Figma Personal Access Token"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && isExtractValid && handleExtract()
                  }
                  className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
                />
                <a
                  href="https://www.figma.com/developers/api#access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
                >
                  Get a token at figma.com/settings →
                </a>
              </div>
            )}
            {isFigma && storedFigmaPat && (
              <p className="text-xs text-[var(--text-muted)]">
                Using Figma token from Settings.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input
              ref={nameInputRef}
              type="text"
              placeholder="Untitled design system"
              value={blankName}
              onChange={(e) => setBlankName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && isBlankValid && handleStartBlank()
              }
              className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
            />
            <div className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-app)] p-3 text-xs text-[var(--text-muted)]">
              You'll get an empty layout.md with the standard section headings.
              Add tokens, components, branding, and context from the Source
              Panel once you're in.
            </div>
          </div>
        )}

        {saveError && (
          <p className="mt-3 text-xs text-[var(--status-error)]">{saveError}</p>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          {mode === "extract" ? (
            <button
              onClick={handleExtract}
              disabled={!isExtractValid || !currentOrgId || saving}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Extract
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleStartBlank}
              disabled={!isBlankValid || !currentOrgId || saving}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-30"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Create empty project
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
