"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { ComponentCard } from "@/components/dashboard/ComponentCard";
import { CreateComponentModal } from "@/components/dashboard/CreateComponentModal";
import type { Component } from "@/lib/types/component";

export default function LibraryPage() {
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [components, setComponents] = useState<Component[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (filterStatus) searchParams.set("status", filterStatus);
        if (filterCategory) searchParams.set("category", filterCategory);
        if (search) searchParams.set("search", search);

        const [componentsRes, categoriesRes] = await Promise.all([
          fetch(
            `/api/organizations/${orgId}/components?${searchParams.toString()}`
          ),
          fetch(`/api/organizations/${orgId}/components/categories`),
        ]);

        if (!cancelled && componentsRes.ok) {
          const data: Component[] = await componentsRes.json();
          setComponents(data);
        }
        if (!cancelled && categoriesRes.ok) {
          const data: string[] = await categoriesRes.json();
          setCategories(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [orgId, filterStatus, filterCategory, search, refreshKey]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Library
          </h1>
          {!loading && (
            <span className="text-sm text-[var(--text-muted)]">
              {components.length} component{components.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-[--text-on-accent] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
        >
          Add Component
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="deprecated">Deprecated</option>
        </select>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components..."
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : components.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-[var(--text-muted)]">
            No components found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {components.map((c) => (
            <ComponentCard key={c.id} component={c} orgSlug={orgSlug} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateComponentModal
          orgSlug={orgSlug}
          onClose={() => setShowCreate(false)}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
