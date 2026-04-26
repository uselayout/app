"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getStoredOpenAIKey } from "@/lib/hooks/use-api-key";

interface AdminKitRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  author_org_id: string;
  author_display_name: string | null;
  licence: string;
  tier: string;
  featured: boolean;
  hidden: boolean;
  unlisted: boolean;
  is_new: boolean;
  bespoke_showcase: boolean;
  status: "pending" | "approved";
  card_image_pref: "auto" | "custom" | "hero" | "preview";
  custom_card_image_url: string | null;
  hero_image_url: string | null;
  preview_image_url: string | null;
  upvote_count: number;
  import_count: number;
  created_at: string;
  showcase_generated_at: string | null;
  preview_generated_at: string | null;
  hero_generated_at: string | null;
}

type ToastFn = (msg: string, type?: "success" | "error") => void;

interface RunningJob {
  kitId: string;
  kind: "showcase" | "preview" | "hero" | "approve" | "upload";
  startedAt: number;
}

type FilterTab = "pending" | "all" | "featured" | "hidden";

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "never";
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export function KitsTab({ toast }: { toast: ToastFn }) {
  const [kits, setKits] = useState<AdminKitRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("pending");
  const [jobs, setJobs] = useState<RunningJob[]>([]);
  const [, setTick] = useState(0);
  const tickRef = useRef<number | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(() => {
    fetch("/api/admin/kits")
      .then((r) => r.json())
      .then((body: { kits: AdminKitRow[] }) => setKits(body.kits))
      .catch((e) => toast(e instanceof Error ? e.message : "Failed to load kits", "error"));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  // Tick every second so elapsed timers re-render while jobs are in flight.
  useEffect(() => {
    if (jobs.length === 0) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    if (tickRef.current) return;
    tickRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [jobs.length]);

  async function patch(
    id: string,
    body: {
      featured?: boolean;
      hidden?: boolean;
      unlisted?: boolean;
      isNew?: boolean;
      bespokeShowcase?: boolean;
      cardImagePref?: AdminKitRow["card_image_pref"];
    },
  ) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      toast("Kit updated", "success");
      setKits((rows) =>
        rows
          ? rows.map((r) => {
              if (r.id !== id) return r;
              const next = { ...r };
              if (body.featured !== undefined) next.featured = body.featured;
              if (body.hidden !== undefined) next.hidden = body.hidden;
              if (body.unlisted !== undefined) next.unlisted = body.unlisted;
              if (body.isNew !== undefined) next.is_new = body.isNew;
              if (body.bespokeShowcase !== undefined) next.bespoke_showcase = body.bespokeShowcase;
              if (body.cardImagePref !== undefined) next.card_image_pref = body.cardImagePref;
              return next;
            })
          : rows,
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function approve(id: string, name: string) {
    const storedKey = getStoredOpenAIKey();
    setJobs((j) => [...j, { kitId: id, kind: "approve", startedAt: Date.now() }]);
    toast(`Approving "${name}" and firing showcase + preview + hero...`, "success");
    try {
      const res = await fetch(`/api/admin/kits/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storedKey ? { openaiApiKey: storedKey } : {}),
      });
      const body: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Approve failed (HTTP ${res.status})`);
      toast(`"${name}" approved. Showcase/preview/hero generating in the background.`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Approve failed", "error");
    } finally {
      setJobs((j) => j.filter((x) => !(x.kitId === id && x.kind === "approve")));
    }
  }

  function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image"));
      };
      img.src = url;
    });
  }

  async function uploadCustomCard(id: string, name: string, file: File) {
    const REQ_W = 1440, REQ_H = 1080;
    try {
      const dims = await readImageDimensions(file);
      if (dims.width !== REQ_W || dims.height !== REQ_H) {
        toast(`Image must be exactly ${REQ_W}\u00d7${REQ_H}. Yours is ${dims.width}\u00d7${dims.height}.`, "error");
        return;
      }
    } catch {
      toast("Could not read image dimensions. Try a different file.", "error");
      return;
    }

    setJobs((j) => [...j, { kitId: id, kind: "upload", startedAt: Date.now() }]);
    toast(`Uploading custom card for "${name}"...`, "success");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/kits/${id}/custom-card`, { method: "POST", body: form });
      const body: { ok?: boolean; error?: string; url?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Upload failed (HTTP ${res.status})`);
      toast(`Custom card uploaded for "${name}".`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setJobs((j) => j.filter((x) => !(x.kitId === id && x.kind === "upload")));
    }
  }

  async function removeCustomCard(id: string, name: string) {
    if (!confirm(`Remove the uploaded card image from "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/kits/${id}/custom-card`, { method: "DELETE" });
      const body: { ok?: boolean; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Remove failed (HTTP ${res.status})`);
      toast(`Custom card removed from "${name}".`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Remove failed", "error");
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Delete kit "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      toast("Kit deleted", "success");
      setKits((rows) => (rows ? rows.filter((r) => r.id !== id) : rows));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Delete failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function regenShowcase(id: string, name: string) {
    setJobs((j) => [...j, { kitId: id, kind: "showcase", startedAt: Date.now() }]);
    toast(`Generating showcase for "${name}"... this takes 20-40s`, "success");
    try {
      const res = await fetch(`/api/admin/kits/${id}/generate-showcase`, { method: "POST" });
      const body: { ok?: boolean; error?: string; length?: number } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Showcase generation failed (HTTP ${res.status})`);
      toast(`Showcase regenerated for "${name}" (${body.length ?? 0} chars)`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Showcase generation failed", "error");
    } finally {
      setJobs((j) => j.filter((x) => !(x.kitId === id && x.kind === "showcase")));
    }
  }

  async function regenPreview(id: string, name: string) {
    setJobs((j) => [...j, { kitId: id, kind: "preview", startedAt: Date.now() }]);
    toast(`Capturing preview for "${name}"... this takes 30-60s (Playwright)`, "success");
    try {
      const res = await fetch(`/api/admin/kits/${id}/generate-preview`, { method: "POST" });
      const body: { ok?: boolean; error?: string; previewUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Preview generation failed (HTTP ${res.status})`);
      toast(`Preview regenerated for "${name}"`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Preview generation failed", "error");
    } finally {
      setJobs((j) => j.filter((x) => !(x.kitId === id && x.kind === "preview")));
    }
  }

  async function regenHero(id: string, name: string) {
    const storedKey = getStoredOpenAIKey();
    setJobs((j) => [...j, { kitId: id, kind: "hero", startedAt: Date.now() }]);
    toast(`Generating hero cover for "${name}"... this takes 20-40s (GPT Image 2)`, "success");
    try {
      const res = await fetch(`/api/admin/kits/${id}/generate-hero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storedKey ? { openaiApiKey: storedKey } : {}),
      });
      const body: { ok?: boolean; error?: string; heroUrl?: string } = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `Hero generation failed (HTTP ${res.status})`);
      toast(`Hero cover generated for "${name}"`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Hero generation failed", "error");
    } finally {
      setJobs((j) => j.filter((x) => !(x.kitId === id && x.kind === "hero")));
    }
  }

  const filtered = !kits
    ? null
    : filter === "pending"
      ? kits.filter((k) => k.status === "pending")
      : filter === "hidden"
        ? kits.filter((k) => k.hidden)
        : filter === "featured"
          ? kits.filter((k) => k.featured)
          : kits;

  const pendingCount = kits ? kits.filter((k) => k.status === "pending").length : 0;

  function jobFor(kitId: string, kind: RunningJob["kind"]): RunningJob | undefined {
    return jobs.find((j) => j.kitId === kitId && j.kind === kind);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Kit Gallery</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Self-published kits land in Pending. Approve to fire showcase + preview + hero and make them public. Card image: pick which artwork shows on the gallery card, or upload your own (1440×1080 PNG/JPG/WEBP).
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["pending", "all", "featured", "hidden"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs transition-colors inline-flex items-center gap-1.5"
              style={{
                background: filter === f ? "var(--bg-elevated)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                border: filter === f ? "1px solid var(--studio-border)" : "1px solid transparent",
              }}
            >
              {f === "pending" ? "Pending" : f === "all" ? "All" : f === "featured" ? "Featured" : "Hidden"}
              {f === "pending" && pendingCount > 0 && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--mkt-accent)", color: "#08090a" }}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!filtered ? (
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>Loading kits…</div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-md p-6 text-center text-xs"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-muted)",
            border: "1px solid var(--studio-border)",
          }}
        >
          No kits match that filter.
        </div>
      ) : (
        <div
          className="rounded-md"
          style={{ border: "1px solid var(--studio-border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-panel)" }}>
                <th className="text-left font-medium px-3 py-2" style={{ color: "var(--text-muted)" }}>Kit</th>
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>Showcase</th>
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>Preview</th>
                <th className="text-left font-medium px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>Hero</th>
                <th className="text-right font-medium px-3 py-2" style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kit) => {
                const showcaseJob = jobFor(kit.id, "showcase");
                const previewJob = jobFor(kit.id, "preview");
                const heroJob = jobFor(kit.id, "hero");
                const approveJob = jobFor(kit.id, "approve");
                const uploadJob = jobFor(kit.id, "upload");
                const anyJob = showcaseJob || previewJob || heroJob || approveJob || uploadJob;
                const hasCustom = !!kit.custom_card_image_url;
                const hasHero = !!kit.hero_image_url;
                const hasPreview = !!kit.preview_image_url;
                const showCardPicker = hasCustom || hasHero || hasPreview;
                return (
                  <tr
                    key={kit.id}
                    style={{
                      borderTop: "1px solid var(--studio-border)",
                      opacity: kit.hidden ? 0.55 : 1,
                    }}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/gallery/${kit.slug}`}
                          target="_blank"
                          className="font-medium hover:underline"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {kit.name}
                        </Link>
                        {kit.status === "pending" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#f59e0b", color: "#1a0f00" }}>Pending</span>
                        )}
                        {kit.is_new && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#10b981", color: "#04261a" }}>New</span>
                        )}
                        {kit.bespoke_showcase && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{
                              background: "rgba(139, 92, 246, 0.18)",
                              color: "#c4b5fd",
                              border: "1px solid rgba(139, 92, 246, 0.4)",
                            }}
                            title="Live Preview uses the Claude-generated bespoke showcase. Click 'Use uniform layout' in Generate to revert."
                          >
                            Bespoke
                          </span>
                        )}
                        {kit.featured && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--mkt-accent)", color: "#08090a" }}>Featured</span>
                        )}
                        {kit.hidden && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--studio-border)", color: "var(--text-muted)" }}>Hidden</span>
                        )}
                        {kit.unlisted && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--studio-border)", color: "var(--text-muted)" }}>Unlisted</span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {kit.slug} · {kit.licence} · {kit.tier}
                      </div>
                      {showCardPicker && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                          <span>Card:</span>
                          {(["auto", "custom", "hero", "preview"] as const).map((opt) => {
                            const enabled =
                              opt === "auto" ||
                              (opt === "custom" && hasCustom) ||
                              (opt === "hero" && hasHero) ||
                              (opt === "preview" && hasPreview);
                            const isActive = kit.card_image_pref === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                disabled={!enabled || busy === kit.id || !!anyJob}
                                onClick={() => patch(kit.id, { cardImagePref: opt })}
                                className="px-1.5 py-0.5 rounded text-[10px] transition-colors disabled:opacity-30"
                                style={{
                                  background: isActive ? "var(--bg-elevated)" : "transparent",
                                  color: isActive ? "var(--text-primary)" : "var(--text-muted)",
                                  border: "1px solid var(--studio-border)",
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {showcaseJob ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--mkt-accent)" }} />
                          Generating… {formatElapsed(Date.now() - showcaseJob.startedAt)}
                        </span>
                      ) : (
                        <span className="text-[11px]">{formatTimestamp(kit.showcase_generated_at)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {previewJob ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--mkt-accent)" }} />
                          Capturing… {formatElapsed(Date.now() - previewJob.startedAt)}
                        </span>
                      ) : (
                        <span className="text-[11px]">{formatTimestamp(kit.preview_generated_at)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell" style={{ color: "var(--text-secondary)" }}>
                      {heroJob ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--mkt-accent)" }} />
                          Generating… {formatElapsed(Date.now() - heroJob.startedAt)}
                        </span>
                      ) : (
                        <span className="text-[11px]">{formatTimestamp(kit.hero_generated_at)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                        {kit.status === "pending" && (
                          <button
                            type="button"
                            disabled={!!approveJob || !!anyJob}
                            onClick={() => approve(kit.id, kit.name)}
                            className="px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-40"
                            style={{
                              background: "var(--mkt-accent)",
                              color: "#08090a",
                              border: "1px solid var(--mkt-accent)",
                            }}
                            title="Approve and fire showcase + preview + hero generation"
                          >
                            {approveJob ? `Approving… ${formatElapsed(Date.now() - approveJob.startedAt)}` : "Approve"}
                          </button>
                        )}
                        <input
                          ref={(el) => {
                            fileInputs.current[kit.id] = el;
                          }}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadCustomCard(kit.id, kit.name, f);
                            e.target.value = "";
                          }}
                        />
                        <ActionMenu
                          label={uploadJob ? "Uploading…" : "Card"}
                          loading={!!uploadJob}
                          disabled={!!anyJob}
                          items={[
                            {
                              label: hasCustom ? "Replace card" : "Upload card",
                              onClick: () => fileInputs.current[kit.id]?.click(),
                              disabled: !!uploadJob,
                              hint: "1440×1080 PNG/JPG/WEBP",
                            },
                            ...(hasCustom
                              ? [{
                                  label: "Clear card",
                                  onClick: () => removeCustomCard(kit.id, kit.name),
                                  hint: "Remove the uploaded image, fall back to auto",
                                }]
                              : []),
                          ]}
                        />
                        <ActionMenu
                          label="Status"
                          disabled={busy === kit.id || !!anyJob}
                          items={[
                            {
                              label: kit.featured ? "Unfeature" : "Feature",
                              onClick: () => patch(kit.id, { featured: !kit.featured }),
                              active: kit.featured,
                            },
                            {
                              label: kit.is_new ? "Unmark new" : "Mark new",
                              onClick: () => patch(kit.id, { isNew: !kit.is_new }),
                              active: kit.is_new,
                            },
                            {
                              label: kit.hidden ? "Unhide" : "Hide",
                              onClick: () => patch(kit.id, { hidden: !kit.hidden }),
                              active: kit.hidden,
                            },
                            {
                              label: "Delete kit",
                              onClick: () => remove(kit.id, kit.name),
                              danger: true,
                              hint: "Permanently removes the kit",
                            },
                          ]}
                        />
                        <RegenMenu
                          showcase={{
                            running: !!showcaseJob,
                            label: showcaseJob
                              ? `Showcase… ${formatElapsed(Date.now() - showcaseJob.startedAt)}`
                              : kit.bespoke_showcase
                                ? "Regen bespoke showcase"
                                : "Switch to bespoke (Claude)",
                            onClick: () => regenShowcase(kit.id, kit.name),
                          }}
                          preview={{ running: !!previewJob, label: previewJob ? `Preview… ${formatElapsed(Date.now() - previewJob.startedAt)}` : "Regen preview", onClick: () => regenPreview(kit.id, kit.name) }}
                          hero={{ running: !!heroJob, label: heroJob ? `Hero… ${formatElapsed(Date.now() - heroJob.startedAt)}` : "Regen hero", onClick: () => regenHero(kit.id, kit.name) }}
                          revertToUniform={
                            kit.bespoke_showcase
                              ? () => patch(kit.id, { bespokeShowcase: false })
                              : undefined
                          }
                          anyJob={!!anyJob}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface RegenAction {
  running: boolean;
  label: string;
  onClick: () => void;
}

function RegenMenu({
  showcase,
  preview,
  hero,
  revertToUniform,
  anyJob,
}: {
  showcase: RegenAction;
  preview: RegenAction;
  hero: RegenAction;
  /** Present only when the kit is currently bespoke. Flips back to the uniform template. */
  revertToUniform?: () => void;
  anyJob: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const running = showcase.running || preview.running || hero.running;
  const label = showcase.running
    ? showcase.label
    : preview.running
      ? preview.label
      : hero.running
        ? hero.label
        : "Generate";

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={anyJob}
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40 inline-flex items-center gap-1"
        style={{
          border: "1px solid var(--studio-border)",
          color: running ? "var(--mkt-accent)" : "var(--text-secondary)",
        }}
        title="Regenerate showcase, preview, or hero"
      >
        {label}
        <span aria-hidden style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 z-10 min-w-[180px] rounded-md py-1 shadow-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--studio-border)",
          }}
        >
          {[
            { ...showcase, hint: "Claude Sonnet · ~30s · costs credits" },
            { ...preview, hint: "Playwright · ~45s" },
            { ...hero, hint: "GPT Image 2 · ~30s · costs ~$0.04" },
          ].map((item) => (
            <button
              key={item.label + item.hint}
              type="button"
              disabled={item.running}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full text-left px-3 py-2 text-[12px] transition-colors disabled:opacity-50 flex flex-col gap-0.5 hover:bg-[var(--bg-hover)]"
              style={{ color: "var(--text-primary)" }}
            >
              <span>{item.label}</span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {item.hint}
              </span>
            </button>
          ))}
          {revertToUniform && (
            <>
              <div style={{ height: 1, background: "var(--studio-border)", margin: "4px 0" }} />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  revertToUniform();
                }}
                className="w-full text-left px-3 py-2 text-[12px] transition-colors flex flex-col gap-0.5 hover:bg-[var(--bg-hover)]"
                style={{ color: "var(--text-primary)" }}
              >
                <span>Use uniform layout</span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Switches Live Preview back to the standard template (cached bespoke kept)
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  /** Toggled-on state — gives the item a subtle highlighted background. */
  active?: boolean;
  /** Destructive action — renders the label in red. */
  danger?: boolean;
  /** One-line caption shown below the label. */
  hint?: string;
}

function ActionMenu({
  label,
  items,
  disabled,
  loading,
}: {
  label: string;
  items: ActionMenuItem[];
  disabled?: boolean;
  /** Tints the trigger label with the accent colour to signal in-flight work. */
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40 inline-flex items-center gap-1"
        style={{
          border: "1px solid var(--studio-border)",
          color: loading ? "var(--mkt-accent)" : "var(--text-secondary)",
        }}
      >
        {label}
        <span aria-hidden style={{ fontSize: 10, opacity: 0.7 }}>▾</span>
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 z-10 min-w-[180px] rounded-md py-1 shadow-lg"
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--studio-border)",
          }}
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className="w-full text-left px-3 py-2 text-[12px] transition-colors disabled:opacity-50 flex flex-col gap-0.5 hover:bg-[var(--bg-hover)]"
              style={{
                color: item.danger ? "#ef4444" : "var(--text-primary)",
                background: item.active ? "var(--bg-hover)" : undefined,
              }}
            >
              <span>{item.label}</span>
              {item.hint && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {item.hint}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
