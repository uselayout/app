"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import type { PublicKitSummary, KitSort } from "@/lib/types/kit";
import { KitCard } from "./KitCard";

const SORT_OPTIONS: Array<{ value: KitSort; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "top", label: "Top" },
  { value: "new", label: "New" },
];

type Theme = "dark" | "light";
const THEME_KEY = "layout-gallery-theme";

interface Props {
  initialKits: PublicKitSummary[];
  availableTags: string[];
  initialTag?: string;
  initialSort: KitSort;
  initialQ?: string;
}

export function GalleryPageClient({
  initialKits,
  availableTags,
  initialTag,
  initialSort,
  initialQ,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [q, setQ] = useState(initialQ ?? "");
  const [tag, setTag] = useState<string | undefined>(initialTag);
  const [sort, setSort] = useState<KitSort>(initialSort);
  const [theme, setTheme] = useState<Theme>("dark");

  // Hydrate persisted theme and apply it to <html data-mkt-theme="..."> so the
  // cascade reaches the page hero, cards, inputs, and any deeper children.
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem(THEME_KEY)) as Theme | null;
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.setAttribute("data-mkt-theme", initial);
    return () => {
      document.documentElement.removeAttribute("data-mkt-theme");
    };
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-mkt-theme", next);
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, next);
  }

  // Sync URL with state so links are shareable and back/forward work.
  useEffect(() => {
    const next = new URLSearchParams(searchParams.toString());
    if (q) next.set("q", q);
    else next.delete("q");
    if (tag) next.set("tag", tag);
    else next.delete("tag");
    if (sort && sort !== "featured") next.set("sort", sort);
    else next.delete("sort");
    startTransition(() => {
      router.replace(`/gallery?${next.toString()}`, { scroll: false });
    });
  }, [q, tag, sort, router, searchParams]);

  const filteredKits = useMemo(() => {
    let kits = initialKits;
    if (tag) kits = kits.filter((k) => k.tags.includes(tag));
    if (q) {
      const needle = q.toLowerCase();
      kits = kits.filter(
        (k) =>
          k.name.toLowerCase().includes(needle) ||
          (k.description ?? "").toLowerCase().includes(needle)
      );
    }
    const sorted = [...kits];
    if (sort === "featured") {
      sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.upvoteCount !== b.upvoteCount) return b.upvoteCount - a.upvoteCount;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
    } else if (sort === "top") {
      sorted.sort((a, b) => b.upvoteCount - a.upvoteCount);
    } else {
      sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [initialKits, q, tag, sort]);

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Search kits..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full md:max-w-xs px-4 py-2.5 rounded-xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[var(--mkt-text-primary)] text-[14px] placeholder:text-[var(--mkt-text-muted)] focus:outline-none focus:border-[var(--mkt-text-secondary)]"
        />

        <div className="flex items-center gap-2">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSort(opt.value)}
              className={`px-3 py-1.5 rounded-full text-[13px] transition-colors ${
                sort === opt.value
                  ? "bg-[var(--mkt-text-primary)] text-[var(--mkt-bg)]"
                  : "border border-[var(--mkt-border-strong)] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="ml-1 flex items-center justify-center w-8 h-8 rounded-full border border-[var(--mkt-border-strong)] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)] transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {availableTags.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTag(undefined)}
            className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
              !tag
                ? "bg-[var(--mkt-accent)] text-[#08090a]"
                : "border border-[var(--mkt-border-strong)] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
            }`}
          >
            All
          </button>
          {availableTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTag(tag === t ? undefined : t)}
              className={`px-3 py-1 rounded-full text-[12px] transition-colors ${
                tag === t
                  ? "bg-[var(--mkt-accent)] text-[#08090a]"
                  : "border border-[var(--mkt-border-strong)] text-[var(--mkt-text-secondary)] hover:text-[var(--mkt-text-primary)]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filteredKits.length === 0 ? (
        <div className="rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] p-12 text-center">
          <p className="text-[var(--mkt-text-primary)] text-lg mb-2">No kits match that filter</p>
          <p className="text-[var(--mkt-text-muted)] text-sm">
            Try clearing the search or picking a different tag.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKits.map((kit) => (
            <KitCard key={kit.id} kit={kit} />
          ))}
        </div>
      )}
    </div>
  );
}
