"use client";

import { useState, useEffect, useCallback } from "react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { TemplateCard } from "@/components/marketing/TemplateCard";
import type { Template } from "@/lib/types/template";

const CATEGORIES = ["All", "General", "Corporate", "Bold", "Minimal"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/templates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchTemplates, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchTemplates, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[var(--mkt-bg)]">
        <MarketingHeader />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            Design System Templates
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Start with a professionally crafted design system
          </p>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
                  category === cat
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : templates.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-base text-slate-500">No templates found</p>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
