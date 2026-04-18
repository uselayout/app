"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useProjectStore } from "@/lib/store/project";
import type { BrandingAsset, BrandingSlot } from "@/lib/types";

interface BrandingTabProps {
  projectId: string;
  orgId: string;
  assets: BrandingAsset[];
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/x-icon,.png,.jpg,.jpeg,.webp,.svg,.gif,.ico";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ASSETS = 10;

const SLOT_OPTIONS: { value: BrandingSlot; label: string; hint: string }[] = [
  { value: "primary", label: "Primary logo", hint: "Main full-colour logo" },
  { value: "secondary", label: "Secondary logo", hint: "Inverted / one-colour" },
  { value: "wordmark", label: "Wordmark", hint: "Text-only lockup" },
  { value: "mark", label: "Icon mark", hint: "Symbol without text" },
  { value: "favicon", label: "Favicon", hint: "Browser tab / app icon" },
  { value: "other", label: "Other", hint: "Uncategorised" },
];

export function BrandingTab({ projectId, orgId, assets }: BrandingTabProps) {
  const updateBrandingAssets = useProjectStore((s) => s.updateBrandingAssets);
  const setLayoutMdLocal = useProjectStore((s) => s.setLayoutMdLocal);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList | null, initialSlot: BrandingSlot = "primary") => {
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

  const setSlot = useCallback(
    async (asset: BrandingAsset, slot: BrandingSlot) => {
      if (asset.slot === slot) return;
      setBusy(true);
      try {
        const response = await fetch(
          `/api/organizations/${orgId}/projects/${projectId}/assets/${asset.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "branding", slot }),
          }
        );
        if (!response.ok) {
          toast.error("Failed to change slot");
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

      {assets.length > 0 && (
        <ul className="mt-3 space-y-2">
          {assets.map((asset) => (
            <li
              key={asset.id}
              className="rounded-md border border-[var(--studio-border)] bg-[var(--bg-surface)] p-2"
            >
              <div className="flex gap-2">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--studio-border)] bg-white/5">
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="max-h-14 max-w-14 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div
                    className="truncate text-xs text-[var(--text-primary)]"
                    title={asset.name}
                  >
                    {asset.name}
                  </div>
                  <select
                    value={asset.slot}
                    disabled={busy}
                    onChange={(e) =>
                      setSlot(asset, e.target.value as BrandingSlot)
                    }
                    className="w-full rounded border border-[var(--studio-border)] bg-[var(--bg-panel)] px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                  >
                    {SLOT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.hint}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>{Math.ceil(asset.size / 1024)} KB</span>
                    <button
                      type="button"
                      onClick={() => remove(asset)}
                      disabled={busy}
                      title="Delete asset"
                      className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
