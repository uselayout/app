"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/project";
import {
  getStoredGoogleApiKey,
  getStoredOpenAIKey,
} from "@/lib/hooks/use-api-key";
import type { BrandingAsset, BrandingSlot, BrandingVariant } from "@/lib/types";

interface BrandingTabProps {
  projectId: string;
  orgId: string;
  assets: BrandingAsset[];
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon,.png,.jpg,.jpeg,.webp,.svg,.gif,.ico";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ASSETS = 10;

const SLOT_OPTIONS: { value: BrandingSlot; label: string; hint: string }[] = [
  { value: "primary", label: "Primary logo", hint: "Main full logo" },
  { value: "secondary", label: "Secondary logo", hint: "Alternate full logo" },
  { value: "wordmark", label: "Wordmark", hint: "Text-only lockup" },
  { value: "mark", label: "Icon mark", hint: "Symbol without text" },
  { value: "favicon", label: "Favicon", hint: "Browser tab / app icon" },
  { value: "other", label: "Other", hint: "Uncategorised" },
];

const VARIANT_OPTIONS: { value: BrandingVariant; label: string; hint: string }[] = [
  { value: "colour", label: "Colour", hint: "Full-colour version for light surfaces" },
  { value: "white", label: "White", hint: "White fill — use on dark surfaces" },
  { value: "black", label: "Black", hint: "Black fill — use on light surfaces" },
  { value: "mono", label: "Mono", hint: "Single-colour / outline treatment" },
];

export function BrandingTab({ projectId, orgId, assets }: BrandingTabProps) {
  const updateBrandingAssets = useProjectStore((s) => s.updateBrandingAssets);
  const setLayoutMdLocal = useProjectStore((s) => s.setLayoutMdLocal);
  const [busy, setBusy] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genSlot, setGenSlot] = useState<BrandingSlot>("primary");
  const [genVariant, setGenVariant] = useState<BrandingVariant>("colour");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generate = useCallback(async () => {
    const prompt = genPrompt.trim();
    if (!prompt) {
      toast.error("Describe the asset you want to generate");
      return;
    }
    if (assets.length >= MAX_ASSETS) {
      toast.error(`Max ${MAX_ASSETS} branding assets per project`);
      return;
    }
    const googleKey = getStoredGoogleApiKey();
    const openaiKey = getStoredOpenAIKey();
    if (!googleKey && !openaiKey) {
      toast.error("Add a Google AI or OpenAI API key in Settings to generate brand assets.");
      return;
    }
    const isTextCritical =
      genSlot === "primary" ||
      genSlot === "secondary" ||
      genSlot === "wordmark" ||
      genSlot === "mark";
    if (isTextCritical && !openaiKey) {
      toast.message("Using Gemini for this logo — add an OpenAI key for legible text rendering.");
    }

    setGenerating(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (googleKey) headers["X-Google-Api-Key"] = googleKey;
      if (openaiKey) headers["X-OpenAI-Api-Key"] = openaiKey;

      const response = await fetch(
        `/api/organizations/${orgId}/projects/${projectId}/assets/generate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            slot: genSlot,
            variant: genVariant,
            prompt,
          }),
        }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to generate asset");
        return;
      }
      const payload = (await response.json()) as {
        asset: BrandingAsset;
        brandingAssets: BrandingAsset[];
        layoutMd?: string;
        provider?: "gemini" | "openai";
      };
      updateBrandingAssets(projectId, payload.brandingAssets);
      if (payload.layoutMd) setLayoutMdLocal(projectId, payload.layoutMd);
      toast.success(
        `Generated ${genSlot}${payload.provider ? ` via ${payload.provider === "openai" ? "OpenAI" : "Gemini"}` : ""}`
      );
      setGenPrompt("");
      setShowGenerateForm(false);
    } finally {
      setGenerating(false);
    }
  }, [genPrompt, genSlot, genVariant, assets.length, orgId, projectId, updateBrandingAssets, setLayoutMdLocal]);

  const upload = useCallback(
    async (
      files: FileList | null,
      initialSlot: BrandingSlot = "primary",
      initialVariant: BrandingVariant = "colour"
    ) => {
      if (!files || files.length === 0) return;
      if (assets.length + files.length > MAX_ASSETS) {
        toast.error(`Max ${MAX_ASSETS} branding assets per project`);
        return;
      }

      setBusy(true);
      try {
        let latest = assets;
        for (const file of Array.from(files)) {
          if (file.size > MAX_BYTES) {
            toast.error(`${file.name} is larger than 5 MB`);
            continue;
          }
          const form = new FormData();
          form.set("kind", "branding");
          form.set("file", file);
          form.set("slot", initialSlot);
          form.set("variant", initialVariant);

          const response = await fetch(
            `/api/organizations/${orgId}/projects/${projectId}/assets`,
            { method: "POST", body: form }
          );
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            toast.error(err.error ?? `Failed to upload ${file.name}`);
            continue;
          }
          const payload = (await response.json()) as {
            asset: BrandingAsset;
            brandingAssets: BrandingAsset[];
            layoutMd?: string;
          };
          latest = payload.brandingAssets;
          if (payload.layoutMd) setLayoutMdLocal(projectId, payload.layoutMd);
          toast.success(`Added ${file.name}`);
        }
        updateBrandingAssets(projectId, latest);
      } finally {
        setBusy(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [assets, orgId, projectId, updateBrandingAssets, setLayoutMdLocal]
  );

  const patchAsset = useCallback(
    async (
      asset: BrandingAsset,
      patch: { slot?: BrandingSlot; variant?: BrandingVariant }
    ) => {
      setBusy(true);
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/projects/${projectId}/assets/${asset.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "branding", ...patch }),
          }
        );
        if (!response.ok) {
          toast.error("Failed to update asset");
          return;
        }
        const payload = (await response.json()) as {
          brandingAssets: BrandingAsset[];
          layoutMd?: string;
        };
        updateBrandingAssets(projectId, payload.brandingAssets);
        if (payload.layoutMd) setLayoutMdLocal(projectId, payload.layoutMd);
      } finally {
        setBusy(false);
      }
    },
    [orgId, projectId, updateBrandingAssets, setLayoutMdLocal]
  );

  const remove = useCallback(
    async (asset: BrandingAsset) => {
      setBusy(true);
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/projects/${projectId}/assets/${asset.id}?kind=branding`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          toast.error(`Failed to delete ${asset.name}`);
          return;
        }
        const payload = (await response.json()) as {
          brandingAssets: BrandingAsset[];
          layoutMd?: string;
        };
        updateBrandingAssets(projectId, payload.brandingAssets);
        if (payload.layoutMd) setLayoutMdLocal(projectId, payload.layoutMd);
      } finally {
        setBusy(false);
      }
    },
    [orgId, projectId, updateBrandingAssets, setLayoutMdLocal]
  );

  const atLimit = assets.length >= MAX_ASSETS;

  return (
    <div className="p-3">
      <div className="mb-3">
        <h3 className="text-xs font-medium text-[var(--text-primary)]">
          Branding assets
        </h3>
        <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--text-muted)]">
          Logos, wordmarks, favicons. Referenced in generated code via{" "}
          <code className="font-mono text-[10px] text-[var(--text-secondary)]">
            data-brand-logo
          </code>
          .
        </p>
      </div>

      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-[var(--studio-border)] px-3 py-4 text-xs text-[var(--text-muted)] transition-colors ${
          atLimit || busy
            ? "pointer-events-none opacity-50"
            : "hover:border-[var(--studio-border-strong)] hover:bg-[var(--studio-accent-subtle)] hover:text-[var(--text-secondary)]"
        }`}
      >
        <Upload size={14} />
        {atLimit
          ? `Maximum ${MAX_ASSETS} assets reached`
          : "Upload logo, wordmark, or favicon"}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          disabled={busy || atLimit}
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
      </label>

      {!atLimit && !showGenerateForm && (
        <button
          type="button"
          onClick={() => setShowGenerateForm(true)}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          <Sparkles size={14} />
          Generate with AI
        </button>
      )}

      {showGenerateForm && !atLimit && (
        <div className="mt-2 space-y-2 rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Generate asset
            </span>
            <button
              type="button"
              onClick={() => {
                setShowGenerateForm(false);
                setGenPrompt("");
              }}
              disabled={generating}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Cancel
            </button>
          </div>
          <textarea
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
            placeholder={
              genSlot === "wordmark"
                ? "Wordmark for a coffee brand called Ember, rounded slab-serif"
                : genSlot === "favicon"
                  ? "A bold flame silhouette, minimal, recognisable at 16px"
                  : "A modern logo for Acme Corp — a friendly cloud storage startup"
            }
            rows={3}
            disabled={generating}
            className="w-full resize-none rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-2 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] disabled:opacity-50"
          />
          <div className="flex items-center gap-1.5">
            <select
              value={genSlot}
              disabled={generating}
              onChange={(e) => setGenSlot(e.target.value as BrandingSlot)}
              className="w-auto rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
            >
              {SLOT_OPTIONS.filter((o) => o.value !== "other").map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={genVariant}
              disabled={generating}
              onChange={(e) => setGenVariant(e.target.value as BrandingVariant)}
              className="w-auto rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
            >
              {VARIANT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={generate}
              disabled={generating || !genPrompt.trim()}
              className="ml-auto flex items-center gap-1 rounded-md bg-[var(--studio-accent)] px-3 py-1 text-[11px] font-medium text-[var(--text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {generating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Generating
                </>
              ) : (
                "Generate"
              )}
            </button>
          </div>
          <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
            Logos, wordmarks, and marks route to OpenAI GPT Image 2.0 when an OpenAI key is set (best text rendering). Other assets use Gemini when available.
          </p>
        </div>
      )}

      {assets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--studio-border)] bg-white/5">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="max-h-12 max-w-12 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <div
                      className="truncate text-xs font-medium text-[var(--text-primary)]"
                      title={asset.name}
                    >
                      {asset.name}
                    </div>
                    <span className="shrink-0 text-[10px] text-[var(--text-muted)]">
                      {Math.ceil(asset.size / 1024)} KB
                    </span>
                  </div>
                  {/* Slot + variant inline. Options carry only the label —
                      `title` attributes surface the hint on hover so the
                      dropdown chrome doesn't stretch to fit long descriptions. */}
                  <div className="mt-1 flex items-center gap-1.5">
                    <select
                      value={asset.slot}
                      disabled={busy}
                      onChange={(e) => {
                        const slot = e.target.value as BrandingSlot;
                        if (slot !== asset.slot) patchAsset(asset, { slot });
                      }}
                      className="w-auto rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                      title={
                        SLOT_OPTIONS.find((o) => o.value === asset.slot)?.hint ??
                        "Slot — which logo role this artwork fills"
                      }
                    >
                      {SLOT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} title={opt.hint}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={asset.variant ?? "colour"}
                      disabled={busy}
                      onChange={(e) => {
                        const variant = e.target.value as BrandingVariant;
                        if (variant !== (asset.variant ?? "colour")) {
                          patchAsset(asset, { variant });
                        }
                      }}
                      className="w-auto rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                      title={
                        VARIANT_OPTIONS.find((o) => o.value === (asset.variant ?? "colour"))?.hint ??
                        "Variant — which surface this artwork suits"
                      }
                    >
                      {VARIANT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} title={opt.hint}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(asset)}
                  disabled={busy}
                  title="Delete asset"
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
