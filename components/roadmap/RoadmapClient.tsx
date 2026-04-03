"use client";

import { useState, useEffect, useCallback } from "react";
import { RoadmapStatusGroup } from "./RoadmapStatusGroup";
import { ProductBadge } from "@/components/changelog/ProductBadge";
import type { ChangelogProduct } from "@/lib/types/changelog";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  product: string;
  status: string;
  voteCount: number;
}

const STATUS_ORDER = [
  { key: "in_progress", label: "In progress", colour: "#34d399" },
  { key: "planned", label: "Planned", colour: "#60a5fa" },
  { key: "considering", label: "Under consideration", colour: "#fbbf24" },
  { key: "shipped", label: "Recently shipped", colour: "#a78bfa" },
] as const;

const PRODUCTS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "studio", label: "Studio" },
  { key: "cli", label: "CLI" },
  { key: "figma-plugin", label: "Figma Plugin" },
  { key: "chrome-extension", label: "Chrome Extension" },
];

function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("layout_voter_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("layout_voter_id", id);
  }
  return id;
}

export function RoadmapClient() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState("all");
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/roadmap");
      if (!res.ok) return;
      const data = await res.json() as { items?: RoadmapItem[] };
      setItems(data.items ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void fetchItems();
    // Load voted items from localStorage
    const stored = localStorage.getItem("layout_voted_items");
    if (stored) {
      try {
        setVotedIds(new Set(JSON.parse(stored) as string[]));
      } catch { /* ignore */ }
    }
  }, [fetchItems]);

  const handleVote = async (itemId: string) => {
    const voterId = getVoterId();
    if (!voterId) return;
    setVotingId(itemId);

    try {
      const res = await fetch("/api/roadmap/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, voterId }),
      });
      if (!res.ok) return;
      const { voted, newCount } = await res.json() as { voted: boolean; newCount: number };

      // Update items optimistically
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, voteCount: newCount } : item
        )
      );

      // Update voted set
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (voted) next.add(itemId);
        else next.delete(itemId);
        localStorage.setItem("layout_voted_items", JSON.stringify([...next]));
        return next;
      });
    } catch { /* silent */ }
    finally { setVotingId(null); }
  };

  const filtered = productFilter === "all"
    ? items
    : items.filter((i) => i.product === productFilter);

  if (loading) {
    return (
      <div className="mt-12">
        <div className="h-4 w-48 rounded bg-white/5 animate-pulse" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      {/* Product filters */}
      <div className="flex gap-2 mb-10">
        {PRODUCTS.map((p) => (
          <button
            key={p.key}
            onClick={() => setProductFilter(p.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: productFilter === p.key ? "rgba(255,255,255,0.15)" : "transparent",
              color: productFilter === p.key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
              border: `1px solid ${productFilter === p.key ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Status groups */}
      <div className="space-y-12">
        {STATUS_ORDER.map((status) => {
          const statusItems = filtered.filter((i) => i.status === status.key);
          if (statusItems.length === 0) return null;
          return (
            <RoadmapStatusGroup
              key={status.key}
              label={status.label}
              colour={status.colour}
              items={statusItems}
              votedIds={votedIds}
              votingId={votingId}
              onVote={handleVote}
            />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-white/40 text-center py-16">
          No roadmap items for this product yet.
        </p>
      )}
    </div>
  );
}
