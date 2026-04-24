"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
  upvote_count: number;
  import_count: number;
  created_at: string;
}

type ToastFn = (msg: string, type?: "success" | "error") => void;

export function KitsTab({ toast }: { toast: ToastFn }) {
  const [kits, setKits] = useState<AdminKitRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "hidden" | "featured">("all");

  const load = useCallback(() => {
    fetch("/api/admin/kits")
      .then((r) => r.json())
      .then((body: { kits: AdminKitRow[] }) => setKits(body.kits))
      .catch((e) => toast(e instanceof Error ? e.message : "Failed to load kits", "error"));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function patch(id: string, patch: Partial<Pick<AdminKitRow, "featured" | "hidden" | "unlisted">>) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
      toast("Kit updated", "success");
      setKits((rows) => (rows ? rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) : rows));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "error");
    } finally {
      setBusy(null);
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
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kits/${id}/generate-showcase`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Showcase generation failed");
      toast(`Regenerated showcase for "${name}"`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Showcase generation failed", "error");
    } finally {
      setBusy(null);
    }
  }

  async function regenPreview(id: string, name: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/kits/${id}/generate-preview`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Preview generation failed");
      toast(`Regenerated preview for "${name}"`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Preview generation failed", "error");
    } finally {
      setBusy(null);
    }
  }

  const filtered = !kits
    ? null
    : filter === "hidden"
      ? kits.filter((k) => k.hidden)
      : filter === "featured"
        ? kits.filter((k) => k.featured)
        : kits;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Kit Gallery</h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Manage public kits. Feature to promote, hide to remove from public listings, or delete entirely.
          </p>
        </div>
        <div className="flex items-center gap-1">
          {(["all", "featured", "hidden"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs transition-colors"
              style={{
                background: filter === f ? "var(--bg-elevated)" : "transparent",
                color: filter === f ? "var(--text-primary)" : "var(--text-muted)",
                border: filter === f ? "1px solid var(--studio-border)" : "1px solid transparent",
              }}
            >
              {f === "all" ? "All" : f === "featured" ? "Featured" : "Hidden"}
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
          className="rounded-md overflow-hidden"
          style={{ border: "1px solid var(--studio-border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--bg-panel)" }}>
                <th className="text-left font-medium px-3 py-2" style={{ color: "var(--text-muted)" }}>Kit</th>
                <th className="text-left font-medium px-3 py-2 hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Author</th>
                <th className="text-right font-medium px-3 py-2 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Upvotes</th>
                <th className="text-right font-medium px-3 py-2 hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Imports</th>
                <th className="text-right font-medium px-3 py-2" style={{ color: "var(--text-muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((kit) => (
                <tr
                  key={kit.id}
                  style={{
                    borderTop: "1px solid var(--studio-border)",
                    opacity: kit.hidden ? 0.55 : 1,
                  }}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/gallery/${kit.slug}`}
                        target="_blank"
                        className="font-medium hover:underline"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {kit.name}
                      </Link>
                      {kit.featured && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "var(--mkt-accent)", color: "#08090a" }}
                        >
                          Featured
                        </span>
                      )}
                      {kit.hidden && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            border: "1px solid var(--studio-border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Hidden
                        </span>
                      )}
                      {kit.unlisted && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            border: "1px solid var(--studio-border)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Unlisted
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {kit.slug} · {kit.licence} · {kit.tier}
                    </div>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {kit.author_display_name ?? kit.author_org_id}
                  </td>
                  <td className="px-3 py-2 text-right hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {kit.upvote_count}
                  </td>
                  <td className="px-3 py-2 text-right hidden sm:table-cell" style={{ color: "var(--text-secondary)" }}>
                    {kit.import_count}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={busy === kit.id}
                        onClick={() => patch(kit.id, { featured: !kit.featured })}
                        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40"
                        style={{
                          background: kit.featured ? "var(--bg-elevated)" : "transparent",
                          color: kit.featured ? "var(--text-primary)" : "var(--text-muted)",
                          border: "1px solid var(--studio-border)",
                        }}
                      >
                        {kit.featured ? "Unfeature" : "Feature"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === kit.id}
                        onClick={() => patch(kit.id, { hidden: !kit.hidden })}
                        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40"
                        style={{
                          background: kit.hidden ? "var(--bg-elevated)" : "transparent",
                          color: kit.hidden ? "var(--text-primary)" : "var(--text-muted)",
                          border: "1px solid var(--studio-border)",
                        }}
                      >
                        {kit.hidden ? "Unhide" : "Hide"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === kit.id}
                        onClick={() => regenShowcase(kit.id, kit.name)}
                        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40"
                        style={{
                          border: "1px solid var(--studio-border)",
                          color: "var(--text-secondary)",
                        }}
                        title="Regenerate bespoke showcase via Claude"
                      >
                        Regen showcase
                      </button>
                      <button
                        type="button"
                        disabled={busy === kit.id}
                        onClick={() => regenPreview(kit.id, kit.name)}
                        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40"
                        style={{
                          border: "1px solid var(--studio-border)",
                          color: "var(--text-secondary)",
                        }}
                        title="Regenerate PNG preview via Playwright"
                      >
                        Regen preview
                      </button>
                      <button
                        type="button"
                        disabled={busy === kit.id}
                        onClick={() => remove(kit.id, kit.name)}
                        className="px-2 py-1 rounded text-[11px] transition-colors disabled:opacity-40"
                        style={{
                          color: "#ef4444",
                          border: "1px solid transparent",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
