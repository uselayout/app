"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateOrgPage() {
  const router = useRouter();
  const addOrganization = useOrgStore((s) => s.addOrganization);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  const effectiveSlug = slugTouched ? slug : autoSlug;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim() || saving) return;

      setSaving(true);
      setError(null);

      try {
        const res = await fetch("/api/organizations/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            slug: effectiveSlug || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res
            .json()
            .catch(() => ({ error: "Failed to create organisation" }));
          throw new Error(
            (body as { error?: string }).error ??
              "Failed to create organisation"
          );
        }

        const org = await res.json();
        addOrganization(org);
        router.push(`/${org.slug}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    },
    [name, effectiveSlug, saving, addOrganization, router]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--bg-app]">
      <div className="w-full max-w-md">
        <Link
          href="/studio"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[--text-muted] hover:text-[--text-primary] transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </Link>

        <div className="rounded-xl border border-[--studio-border] bg-[--bg-panel] p-6">
          <h1 className="text-lg font-semibold text-[--text-primary]">
            Create organisation
          </h1>
          <p className="mt-1 text-sm text-[--text-muted]">
            Organisations let you manage design systems and collaborate with
            your team.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[--text-secondary]">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={50}
                placeholder="e.g. Acme Design"
                className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[--text-secondary]">
                Slug
              </label>
              <input
                type="text"
                value={effectiveSlug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                minLength={3}
                maxLength={48}
                pattern="[a-z0-9][a-z0-9-]*[a-z0-9]"
                placeholder="e.g. acme-design"
                className="w-full rounded-lg border border-[--studio-border] bg-[--bg-surface] px-3 py-2 text-sm text-[--text-primary] placeholder:text-[--text-muted] outline-none focus:border-[--studio-border-focus] transition-colors font-mono"
              />
              <p className="mt-1 text-[11px] text-[--text-muted]">
                Lowercase letters, numbers, and hyphens only. Used in URLs.
              </p>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[--studio-accent] px-4 py-2.5 text-sm font-medium text-[--text-on-accent] transition-colors hover:bg-[--studio-accent-hover] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create organisation"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
