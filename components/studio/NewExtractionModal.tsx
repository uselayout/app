"use client";

import { useState, useEffect, useRef } from "react";
import { X, Layers, Globe, ArrowRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/project";
import { useOrgStore } from "@/lib/store/organization";
import { detectSourceType, normaliseUrl } from "@/lib/util/detect-source";

interface NewExtractionModalProps {
  onClose: () => void;
}

export function NewExtractionModal({ onClose }: NewExtractionModalProps) {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const createProject = useProjectStore((s) => s.createProject);
  const currentOrgId = useOrgStore((s) => s.currentOrgId);
  const [url, setUrl] = useState("");
  const [pat, setPat] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  const QUICK_START_EXAMPLES = [
    { label: "Try Stripe →", url: "https://stripe.com" },
    { label: "Try Linear →", url: "https://linear.app" },
    { label: "Try Vercel →", url: "https://vercel.com" },
  ];

  const sourceType = url ? detectSourceType(url) : null;
  const isFigma = sourceType === "figma";
  const isValid = sourceType !== null && (!isFigma || pat.length > 0);

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

  const handleExtract = () => {
    if (!isValid || !sourceType) return;

    const fullUrl = normaliseUrl(url);
    const projectId =
      crypto.randomUUID?.() ??
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    const projectName = isFigma
      ? "Figma Extraction"
      : new URL(fullUrl).hostname.replace("www.", "");

    createProject({
      id: projectId,
      orgId: currentOrgId ?? "",
      name: projectName,
      sourceType,
      sourceUrl: fullUrl,
      designMd: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isFigma && pat) {
      sessionStorage.setItem(`pat-${projectId}`, pat);
    }
    sessionStorage.setItem(`extract-${projectId}`, "true");

    router.push(`/${orgSlug}/projects/${projectId}/studio`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] p-6 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              New Extraction
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Paste a Figma or website URL to extract a design system
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* URL input */}
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={urlInputRef}
              type="url"
              placeholder="https://figma.com/design/... or https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
              autoFocus
              className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-4 py-3 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
            />
            {sourceType && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isFigma ? (
                  <Layers className="h-4 w-4 text-[var(--studio-accent)]" />
                ) : (
                  <Globe className="h-4 w-4 text-emerald-400" />
                )}
              </div>
            )}
          </div>

          {/* Quick-start chips — only shown when URL input is empty */}
          {!url && (
            <div>
              <p className="text-[var(--text-muted)] text-xs text-center my-2">
                — or try with an example —
              </p>
              <div className="flex gap-2 justify-center flex-wrap">
                {QUICK_START_EXAMPLES.map((example) => (
                  <button
                    key={example.url}
                    type="button"
                    onClick={() => {
                      setUrl(example.url);
                      urlInputRef.current?.focus();
                    }}
                    className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] border border-[var(--studio-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs px-3 py-1.5 rounded-md transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] cursor-pointer"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Figma PAT field */}
          {isFigma && (
            <input
              type="password"
              placeholder="Figma Personal Access Token"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && isValid && handleExtract()}
              className="w-full rounded-lg border border-[rgba(255,255,255,0.16)] bg-[var(--bg-app)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
            />
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExtract}
            disabled={!isValid}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 transition-colors"
          >
            Extract
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
