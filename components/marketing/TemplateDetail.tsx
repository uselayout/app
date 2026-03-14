"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useOrgStore } from "@/lib/store/organization";
import { toast } from "sonner";
import type { TemplatePreview } from "@/lib/types/template";

interface TemplateDetailProps {
  template: TemplatePreview;
}

export function TemplateDetail({ template }: TemplateDetailProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const organizations = useOrgStore((s) => s.organizations);

  const [showForkModal, setShowForkModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [forking, setForking] = useState(false);

  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const handleFork = useCallback(async () => {
    if (!selectedOrgId) return;
    setForking(true);
    try {
      const res = await fetch(`/api/templates/${template.slug}/fork`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: selectedOrgId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to fork template");
      }
      const org = organizations.find((o) => o.id === selectedOrgId);
      toast.success(`Template "${template.name}" forked successfully`);
      setShowForkModal(false);
      if (org) {
        router.push(`/${org.slug}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fork failed");
    } finally {
      setForking(false);
    }
  }, [selectedOrgId, template.slug, template.name, organizations, router]);

  const stats = [
    { label: "Tokens", value: template.tokenCount },
    { label: "Components", value: template.componentCount },
    { label: "Typefaces", value: template.typefaceCount },
    { label: "Icons", value: template.iconCount },
  ];

  return (
    <div>
      {/* Header */}
      <div className="border-b border-slate-200 pb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          {template.name}
        </h1>
        {template.authorName && (
          <p className="mt-2 text-sm text-slate-500">
            by{" "}
            {template.authorUrl ? (
              <a
                href={template.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {template.authorName}
              </a>
            ) : (
              template.authorName
            )}
          </p>
        )}
        {template.description && (
          <p className="mt-3 text-lg text-slate-600">{template.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {template.category}
          </span>
          {template.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Long description */}
      {template.longDescription && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">About</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
            {template.longDescription}
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 text-center"
          >
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Component list */}
      {template.componentNames.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Components</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {template.componentNames.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Typeface list */}
      {template.typefaceNames.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Typefaces</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {template.typefaceNames.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          Use This Template
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Fork this design system into your organisation to start building
        </p>

        {isLoggedIn ? (
          <button
            onClick={() => setShowForkModal(true)}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-700"
          >
            Use This Template
          </button>
        ) : (
          <a
            href={`/login?redirect=/templates/${template.slug}`}
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-700"
          >
            Log in to Use Template
          </a>
        )}
      </div>

      {/* Fork modal */}
      {showForkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Fork Template
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose an organisation to fork &ldquo;{template.name}&rdquo; into.
            </p>

            <div className="mt-4">
              <label
                htmlFor="org-select"
                className="block text-sm font-medium text-slate-700"
              >
                Organisation
              </label>
              <select
                id="org-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowForkModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFork}
                disabled={forking || !selectedOrgId}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-700 disabled:opacity-50"
              >
                {forking ? "Forking..." : "Fork"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
