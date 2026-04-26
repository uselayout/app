"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import type { Project } from "@/lib/types";
import type { KitLicence, KitTier } from "@/lib/types/kit";

interface Props {
  project: Project;
  orgSlug: string;
  open: boolean;
  onClose: () => void;
}

type ToggleKey = "components" | "fonts" | "branding" | "context";

function autoTagsFromProject(project: Project): string[] {
  const tags = new Set<string>();
  const md = project.layoutMd?.toLowerCase() ?? "";
  if (/dark|black|#0[0-9a-f]{2}/i.test(md)) tags.add("dark");
  else tags.add("light");
  if (md.includes("saas") || md.includes("dashboard")) tags.add("saas");
  if (md.includes("mobile") || md.includes("ios") || md.includes("android")) tags.add("mobile");
  return Array.from(tags).slice(0, 3);
}

export function ShareToGalleryModal({ project, orgSlug, open, onClose }: Props) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(
    project.layoutMd?.split("\n").slice(0, 2).join(" ").replace(/[#*`>]/g, "").trim() ?? ""
  );
  const [tagsText, setTagsText] = useState(autoTagsFromProject(project).join(", "));
  const [licence, setLicence] = useState<KitLicence>("MIT");
  const [licenceCustom, setLicenceCustom] = useState("");
  const [unlisted, setUnlisted] = useState(false);
  const [bespokeShowcase, setBespokeShowcase] = useState(false);
  const [include, setInclude] = useState<Record<ToggleKey, boolean>>({
    components: false,
    fonts: (project.uploadedFonts?.length ?? 0) > 0,
    branding: (project.brandingAssets?.length ?? 0) > 0,
    context: (project.contextDocuments?.length ?? 0) > 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishedStatus, setPublishedStatus] = useState<"pending" | "approved" | null>(null);

  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [publishAsLayout, setPublishAsLayout] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((body: { isAdmin: boolean }) => setIsAdmin(body.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [open]);

  async function handleAiSuggest() {
    setAiBusy(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/organizations/${orgSlug}/kits/ai-suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "AI suggestion failed" }));
        throw new Error(body.error ?? "AI suggestion failed");
      }
      const body = (await res.json()) as { description: string; tags: string[] };
      setDescription(body.description);
      setTagsText(body.tags.join(", "));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "AI suggestion failed");
    } finally {
      setAiBusy(false);
    }
  }

  const counts = useMemo(() => ({
    components: 0, // Component count not tracked on Project; fetched at publish time.
    fonts: project.uploadedFonts?.length ?? 0,
    branding: project.brandingAssets?.length ?? 0,
    context: project.contextDocuments?.length ?? 0,
  }), [project]);

  const tier: KitTier = Object.values(include).some(Boolean) ? "rich" : "minimal";

  if (!open) return null;

  async function handlePublish() {
    setSubmitting(true);
    setError(null);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0 && t.length <= 32)
      .slice(0, 12);

    try {
      const res = await fetch(`/api/organizations/${orgSlug}/kits/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          name,
          description: description || undefined,
          tags,
          licence,
          licenceCustom: licence === "custom" ? licenceCustom : undefined,
          tier,
          unlisted,
          bespokeShowcase,
          include,
          publishAs: isAdmin && publishAsLayout ? "layout" : "self",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Publish failed" }));
        throw new Error(body.error ?? "Publish failed");
      }
      const { url, status } = (await res.json()) as {
        url: string | null;
        status?: "pending" | "approved";
      };
      setPublishedUrl(url);
      setPublishedStatus(status ?? "approved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[520px] max-h-[90vh] overflow-auto rounded-[12px] border border-[var(--studio-border)] bg-[var(--bg-panel)] p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-[18px] text-[var(--text-primary)] font-medium">Share to Gallery</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Publish this project as a public kit anyone can import.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {publishedStatus ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4">
              {publishedStatus === "approved" && publishedUrl ? (
                <>
                  <p className="text-[14px] text-[var(--text-primary)]">Published.</p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">Your kit is live at {publishedUrl}.</p>
                </>
              ) : (
                <>
                  <p className="text-[14px] text-[var(--text-primary)]">Submitted for review.</p>
                  <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                    The Layout team will check your kit and publish it to the gallery shortly.
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-3 rounded border border-[var(--studio-border-strong)] text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              >
                Close
              </button>
              {publishedStatus === "approved" && publishedUrl && (
                <Link
                  href={publishedUrl}
                  target="_blank"
                  className="h-8 px-3 flex items-center rounded bg-[var(--studio-accent)] text-[13px] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)]"
                >
                  View in Gallery
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="studio-input"
              />
            </Field>

            <div className="flex items-center justify-between -mb-1">
              <span className="text-[12px] uppercase tracking-wide text-[var(--text-muted)]">
                Description & Tags
              </span>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiBusy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--studio-border-strong)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50 transition-colors"
                title="Generate description and tags with Claude Haiku"
              >
                {aiBusy ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                {aiBusy ? "Generating..." : "Generate with AI"}
              </button>
            </div>

            <Field label="Description">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={400}
                rows={3}
                className="studio-input resize-none"
                placeholder="One or two sentences. Shown on the card."
              />
            </Field>

            <Field label="Tags" hint="Comma-separated. Max 12.">
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="studio-input"
                placeholder="dark, minimal, saas"
              />
            </Field>

            {aiError && (
              <p className="text-[12px] text-red-400 -mt-1">{aiError}</p>
            )}

            <Field label="Licence">
              <div className="flex gap-2">
                {(["MIT", "CC-BY-4.0", "custom"] as KitLicence[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLicence(l)}
                    className={`px-3 py-1.5 rounded text-[13px] transition-colors ${
                      licence === l
                        ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                        : "border border-[var(--studio-border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {licence === "custom" && (
                <textarea
                  value={licenceCustom}
                  onChange={(e) => setLicenceCustom(e.target.value)}
                  rows={2}
                  placeholder="Paste or summarise your licence terms..."
                  className="studio-input resize-none mt-2"
                />
              )}
            </Field>

            <Field label="What's included">
              <div className="flex flex-col gap-1.5 text-[13px] text-[var(--text-primary)]">
                <ToggleRow label="Tokens" count="always" disabled checked />
                <ToggleRow
                  label="Fonts"
                  count={counts.fonts}
                  checked={include.fonts}
                  onChange={(v) => setInclude({ ...include, fonts: v })}
                />
                <ToggleRow
                  label="Branding assets"
                  count={counts.branding}
                  checked={include.branding}
                  onChange={(v) => setInclude({ ...include, branding: v })}
                />
                <ToggleRow
                  label="Context documents"
                  count={counts.context}
                  checked={include.context}
                  onChange={(v) => setInclude({ ...include, context: v })}
                />
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-2">
                Rich kits ({tier}) are imported in full by Studio users. CLI users always get the minimal bundle.
              </p>
            </Field>

            <Field label="Visibility">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUnlisted(false)}
                  className={`px-3 py-1.5 rounded text-[13px] transition-colors ${
                    !unlisted
                      ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                      : "border border-[var(--studio-border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  Public
                </button>
                <button
                  type="button"
                  onClick={() => setUnlisted(true)}
                  className={`px-3 py-1.5 rounded text-[13px] transition-colors ${
                    unlisted
                      ? "bg-[var(--studio-accent)] text-[var(--text-on-accent)]"
                      : "border border-[var(--studio-border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  Unlisted
                </button>
              </div>
            </Field>

            <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-md border border-dashed border-[var(--studio-border-strong)] bg-[var(--bg-surface)] cursor-pointer">
              <input
                type="checkbox"
                checked={bespokeShowcase}
                onChange={(e) => setBespokeShowcase(e.target.checked)}
                className="mt-0.5 accent-[var(--studio-accent)]"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] text-[var(--text-primary)] font-medium">
                  Generate a bespoke AI Live Preview
                </span>
                <span className="text-[12px] text-[var(--text-muted)]">
                  Slower (Claude takes ~30s) but produces a layout tuned to your kit. Default uses our hand-built uniform template.
                </span>
              </span>
            </label>

            {isAdmin && (
              <label className="flex items-start gap-2.5 px-3 py-2.5 rounded-md border border-dashed border-[var(--studio-border-strong)] bg-[var(--bg-surface)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishAsLayout}
                  onChange={(e) => setPublishAsLayout(e.target.checked)}
                  className="mt-0.5 accent-[var(--studio-accent)]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] text-[var(--text-primary)] font-medium">
                    Publish as Layout (official kit)
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    Attribute this kit to the Layout team instead of your personal org. Admin-only.
                  </span>
                </span>
              </label>
            )}

            {error && (
              <div className="text-[13px] text-red-400">{error}</div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-8 px-3 rounded border border-[var(--studio-border-strong)] text-[13px] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={submitting || !name.trim()}
                className="h-8 px-4 rounded bg-[var(--studio-accent)] text-[13px] text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.studio-input) {
          background: var(--bg-surface);
          border: 1px solid var(--studio-border-strong);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 13px;
          color: var(--text-primary);
          width: 100%;
          outline: none;
          transition: border-color var(--duration-base) var(--ease-out);
        }
        :global(.studio-input:focus) {
          border-color: var(--studio-border-focus);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-[12px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
        {hint && <span className="text-[11px] text-[var(--text-muted)]">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  count,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  count: number | "always";
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || count === 0}
      onClick={() => onChange?.(!checked)}
      className={`flex items-center justify-between rounded border px-3 py-2 transition-colors ${
        checked
          ? "border-[var(--studio-border-focus)] bg-[var(--studio-accent-subtle)]"
          : "border-[var(--studio-border-strong)] bg-transparent hover:bg-[var(--bg-hover)]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span>{label}</span>
      <span className="text-[12px] text-[var(--text-muted)]">
        {count === "always" ? "always included" : count === 0 ? "none" : `${count} available`}
      </span>
    </button>
  );
}
