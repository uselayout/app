"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { TemplateDetail } from "@/components/marketing/TemplateDetail";
import type { TemplatePreview } from "@/lib/types/template";

export default function TemplateDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [template, setTemplate] = useState<TemplatePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/templates/${slug}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Template not found" : "Failed to load template");
        }
        const data = await res.json();
        setTemplate(data.template);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-[var(--mkt-bg)]">
        <MarketingHeader />
      </div>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Back link */}
        <Link
          href="/templates"
          className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors duration-150 hover:text-slate-900"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="rotate-180"
          >
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to Templates
        </Link>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-10 w-64 animate-pulse rounded-lg bg-slate-200" />
              <div className="h-5 w-96 animate-pulse rounded-lg bg-slate-200" />
              <div className="mt-8 grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-slate-200"
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">{error}</p>
              <Link
                href="/templates"
                className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:underline"
              >
                Browse all templates
              </Link>
            </div>
          ) : template ? (
            <TemplateDetail template={template} />
          ) : null}
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
