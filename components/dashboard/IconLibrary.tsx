"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useOrgStore } from "@/lib/store/organization";
import { IconDetail } from "@/components/dashboard/IconDetail";
import type { DesignIcon } from "@/lib/types/icon";
import { toast } from "sonner";

const CATEGORY_PATTERNS: Record<string, RegExp> = {
  Navigation: /^(arrow|chevron|menu|sidebar|hamburger)/i,
  Status: /^(check|alert|info|warning|error|success)/i,
  Action: /^(edit|delete|copy|plus|minus|add|remove|trash|close|save)/i,
};

function categoriseByName(name: string): string {
  const slug = name.toLowerCase().replace(/\.[^.]+$/, "");
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(slug)) return category;
  }
  return "General";
}

function filenameToName(filename: string): string {
  return filename
    .replace(/\.svg$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseViewBox(svgContent: string): string {
  const match = svgContent.match(/viewBox="([^"]*)"/);
  return match?.[1] ?? "0 0 24 24";
}

// Note: SVG content is sanitised server-side in the API route
// (script tags and on* event attributes are stripped before storage)
function renderSvgThumb(svg: string): string {
  let result = svg;
  if (/width="[^"]*"/.test(result)) {
    result = result.replace(/width="[^"]*"/, 'width="24"');
  }
  if (/height="[^"]*"/.test(result)) {
    result = result.replace(/height="[^"]*"/, 'height="24"');
  }
  return result;
}

export function IconLibrary() {
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [icons, setIcons] = useState<DesignIcon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<DesignIcon | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!orgId) return;

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams();
        if (filterCategory) searchParams.set("category", filterCategory);
        if (search) searchParams.set("search", search);

        const res = await fetch(
          `/api/organizations/${orgId}/icons?${searchParams.toString()}`
        );

        if (!cancelled && res.ok) {
          const data: DesignIcon[] = await res.json();
          setIcons(data);

          // Build categories from full list
          const cats = [...new Set(data.map((i) => i.category))].sort();
          setCategories(cats);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [orgId, filterCategory, search, refreshKey]);

  async function handleUpload(files: FileList) {
    if (!orgId) return;
    setUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (const file of Array.from(files)) {
      try {
        const svgContent = await file.text();
        const name = filenameToName(file.name);
        const viewbox = parseViewBox(svgContent);
        const category = categoriseByName(file.name);

        const res = await fetch(`/api/organizations/${orgId}/icons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            svg: svgContent,
            viewbox,
            category,
            source: "upload",
          }),
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(
        `Uploaded ${successCount} icon${successCount !== 1 ? "s" : ""}`
      );
    }
    if (errorCount > 0) {
      toast.error(
        `Failed to upload ${errorCount} file${errorCount !== 1 ? "s" : ""}`
      );
    }

    refresh();

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Icons
          </h1>
          {!loading && (
            <span className="text-sm text-[var(--text-muted)]">
              {icons.length} icon{icons.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) handleUpload(e.target.files);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm text-white transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
        />
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
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : icons.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">No icons found</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Upload SVG files to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
          {icons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => setSelectedIcon(icon)}
              className={`group flex flex-col items-center gap-2 rounded-lg border p-3 transition-all duration-[var(--duration-base)] ${
                selectedIcon?.id === icon.id
                  ? "border-[var(--studio-accent)] bg-[var(--studio-accent-subtle)]"
                  : "border-[var(--studio-border)] bg-[var(--bg-surface)] hover:border-[var(--studio-accent)] hover:scale-105"
              }`}
            >
              <div
                className="flex h-12 w-12 items-center justify-center text-[var(--text-primary)]"
                dangerouslySetInnerHTML={{
                  __html: renderSvgThumb(icon.svg),
                }}
              />
              <span className="w-full truncate text-center text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
                {icon.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedIcon && orgId && (
        <IconDetail
          icon={selectedIcon}
          orgId={orgId}
          onClose={() => setSelectedIcon(null)}
          onUpdated={() => {
            refresh();
            setSelectedIcon(null);
          }}
          onDeleted={() => {
            setSelectedIcon(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
