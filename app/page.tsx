"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/lib/store/project";
import { useExtractionStore } from "@/lib/store/extraction";
import type { SourceType } from "@/lib/types";

const AI_KITS = [
  { name: "Linear", price: 99, aesthetic: "Developer tool, dark-first" },
  { name: "Revolut", price: 99, aesthetic: "Dark fintech, data-rich" },
  { name: "Stripe", price: 79, aesthetic: "Clean, trust-focused" },
  { name: "Notion", price: 79, aesthetic: "Document-first, flexible" },
  { name: "Vercel", price: 79, aesthetic: "Minimal, monochrome" },
  { name: "Apple iOS", price: 129, aesthetic: "HIG-compliant, light-first" },
];

function detectSourceType(url: string): SourceType | null {
  if (/figma\.com\/(file|design)\//.test(url)) return "figma";
  try {
    new URL(url);
    return "website";
  } catch {
    return null;
  }
}

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pat, setPat] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const createProject = useProjectStore((s) => s.createProject);
  const startExtraction = useExtractionStore((s) => s.startExtraction);

  const sourceType = url ? detectSourceType(url) : null;
  const isFigma = sourceType === "figma";
  const isValid = sourceType !== null && (!isFigma || pat.length > 0);

  const handleExtract = async () => {
    if (!isValid || !sourceType) return;

    setIsExtracting(true);

    const projectId = crypto.randomUUID();
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

    startExtraction([
      { id: "connect", label: "Connecting to source", status: "pending" },
      { id: "extract", label: "Extracting design data", status: "pending" },
      { id: "generate", label: "Generating DESIGN.md", status: "pending" },
    ]);

    router.push(`/studio/${projectId}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-12">
        {/* Hero */}
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[--text-muted]">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-[--studio-accent]"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium tracking-wide uppercase">
              SuperDuper AI Studio
            </span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[--text-primary]">
            Give your AI agent perfect taste.
          </h1>
          <p className="text-lg text-[--text-secondary]">
            Extract any design system. Build on-brand, every time.
          </p>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste a Figma file URL or website URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-14 border-[--studio-border-strong] bg-[--bg-surface] pr-4 pl-4 text-base text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus] focus:ring-[--studio-accent]/20"
            />
          </div>

          {isFigma && (
            <Input
              type="password"
              placeholder="Figma Personal Access Token (figd_...)"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              className="h-12 border-[--studio-border-strong] bg-[--bg-surface] text-[--text-primary] placeholder:text-[--text-muted] focus:border-[--studio-border-focus]"
            />
          )}

          {sourceType && (
            <div className="flex items-center gap-2 text-sm text-[--text-secondary]">
              <Badge
                variant="secondary"
                className="bg-[--studio-accent-subtle] text-[--studio-accent]"
              >
                {isFigma ? "Figma" : "Website"}
              </Badge>
              <span>detected</span>
            </div>
          )}

          <Button
            onClick={handleExtract}
            disabled={!isValid || isExtracting}
            className="h-12 w-full bg-[--studio-accent] text-[--text-on-accent] hover:bg-[--studio-accent-hover] disabled:opacity-40"
          >
            {isExtracting ? "Starting extraction..." : "Extract Design System"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-[--studio-border]" />
          <span className="text-sm text-[--text-muted]">
            or start with a pre-built AI Kit
          </span>
          <div className="h-px flex-1 bg-[--studio-border]" />
        </div>

        {/* AI Kit Row */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {AI_KITS.map((kit) => (
            <button
              key={kit.name}
              className="group flex flex-col items-center gap-2 rounded-lg border border-[--studio-border] bg-[--bg-surface] p-4 transition-all duration-150 hover:border-[--studio-border-strong] hover:bg-[--bg-elevated]"
            >
              <span className="text-sm font-medium text-[--text-primary] transition-colors group-hover:text-[--studio-accent]">
                {kit.name}
              </span>
              <span className="text-xs text-[--text-muted]">
                &pound;{kit.price}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
