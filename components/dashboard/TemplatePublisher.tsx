"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Template } from "@/lib/types/template";

interface TemplatePublisherProps {
  orgId: string;

}

const CATEGORIES = ["General", "Corporate", "Bold", "Minimal"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface CreateFormData {
  name: string;
  slug: string;
  description: string;
  longDescription: string;
  category: string;
  tags: string;
  authorName: string;
  authorUrl: string;
}

const EMPTY_FORM: CreateFormData = {
  name: "",
  slug: "",
  description: "",
  longDescription: "",
  category: "General",
  tags: "",
  authorName: "",
  authorUrl: "",
};

interface AssetCounts {
  tokens: number;
  components: number;
  typography: number;
  icons: number;
}

export function TemplatePublisher({ orgId }: TemplatePublisherProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateFormData>(EMPTY_FORM);
  const [autoSlug, setAutoSlug] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assetCounts, setAssetCounts] = useState<AssetCounts>({
    tokens: 0,
    components: 0,
    typography: 0,
    icons: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates ?? []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const fetchAssetCounts = useCallback(async () => {
    try {
      const [tokensRes, componentsRes, typographyRes, iconsRes] =
        await Promise.all([
          fetch(`/api/organizations/${orgId}/tokens`),
          fetch(`/api/organizations/${orgId}/components`),
          fetch(`/api/organizations/${orgId}/typography`),
          fetch(`/api/organizations/${orgId}/icons`),
        ]);

      setAssetCounts({
        tokens: tokensRes.ok
          ? ((await tokensRes.json()).tokens?.length ?? 0)
          : 0,
        components: componentsRes.ok
          ? ((await componentsRes.json()).components?.length ?? 0)
          : 0,
        typography: typographyRes.ok
          ? ((await typographyRes.json()).typefaces?.length ?? 0)
          : 0,
        icons: iconsRes.ok ? ((await iconsRes.json()).icons?.length ?? 0) : 0,
      });
    } catch {
      // Silently handle
    }
  }, [orgId]);

  useEffect(() => {
    fetchTemplates();
    fetchAssetCounts();
  }, [fetchTemplates, fetchAssetCounts]);

  const updateField = (field: keyof CreateFormData, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (field === "slug") {
      setAutoSlug(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          longDescription: form.longDescription.trim() || null,
          category: form.category,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          authorName: form.authorName.trim() || null,
          authorUrl: form.authorUrl.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create template");
      }
      toast.success("Template created");
      setForm(EMPTY_FORM);
      setAutoSlug(true);
      setShowCreateForm(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (templateId: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/templates/${templateId}/publish`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to publish");
      toast.success("Template published");
      fetchTemplates();
    } catch {
      toast.error("Failed to publish template");
    }
  };

  const handleUnpublish = async (templateId: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/templates/${templateId}/publish`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to unpublish");
      toast.success("Template unpublished");
      fetchTemplates();
    } catch {
      toast.error("Failed to unpublish template");
    }
  };

  const handleDelete = async (templateId: string) => {
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/templates/${templateId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Template deleted");
      setDeleteConfirm(null);
      fetchTemplates();
    } catch {
      toast.error("Failed to delete template");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Templates
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Publish your design system as a reusable template
          </p>
        </div>
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-white transition-colors duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
          >
            Create Template
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6">
          <h2 className="text-base font-medium text-[var(--text-primary)]">
            New Template
          </h2>

          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="My Design System"
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Slug *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  placeholder="my-design-system"
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="A brief description of the template"
                className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                Long Description
              </label>
              <textarea
                value={form.longDescription}
                onChange={(e) =>
                  updateField("longDescription", e.target.value)
                }
                placeholder="Detailed description of what's included..."
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => updateField("tags", e.target.value)}
                  placeholder="modern, dark, saas"
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Author Name
                </label>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(e) => updateField("authorName", e.target.value)}
                  placeholder="Your name or company"
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)]">
                  Author URL
                </label>
                <input
                  type="text"
                  value={form.authorUrl}
                  onChange={(e) => updateField("authorUrl", e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-lg border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none"
                />
              </div>
            </div>

            {/* Asset preview */}
            <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-panel)] p-4">
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                Current organisation assets
              </p>
              <div className="mt-2 flex gap-4">
                <span className="text-xs text-[var(--text-muted)]">
                  {assetCounts.tokens} tokens
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {assetCounts.components} components
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {assetCounts.typography} typefaces
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {assetCounts.icons} icons
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setForm(EMPTY_FORM);
                  setAutoSlug(true);
                }}
                className="rounded-lg border border-[var(--studio-border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="rounded-lg bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-white transition-colors duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)] disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      <div className="mt-8 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)]"
              />
            ))}
          </div>
        ) : templates.length === 0 && !showCreateForm ? (
          <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              No templates yet. Create one to share your design system.
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-4 transition-all duration-[var(--duration-base)] hover:border-[var(--studio-border-strong)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">
                      {template.name}
                    </h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        template.isPublished
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {template.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  {template.description && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {template.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3 text-[10px] text-[var(--text-muted)]">
                    <span>{template.tokenCount} tokens</span>
                    <span>{template.componentCount} components</span>
                    <span>{template.typefaceCount} typefaces</span>
                    <span>{template.forkCount} forks</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {template.isPublished ? (
                    <button
                      onClick={() => handleUnpublish(template.id)}
                      className="rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePublish(template.id)}
                      className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors duration-[var(--duration-base)] hover:bg-emerald-500/25"
                    >
                      Publish
                    </button>
                  )}

                  {deleteConfirm === template.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors duration-[var(--duration-base)] hover:bg-red-500/25"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors duration-[var(--duration-base)] hover:bg-[var(--bg-hover)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(template.id)}
                      className="rounded-lg border border-[var(--studio-border)] px-3 py-1.5 text-xs text-red-400 transition-colors duration-[var(--duration-base)] hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
