"use client";

import Link from "next/link";
import type { Template } from "@/lib/types/template";

const CATEGORY_GRADIENTS: Record<string, string> = {
  General: "from-indigo-400 to-purple-500",
  Corporate: "from-slate-400 to-blue-500",
  Bold: "from-orange-400 to-rose-500",
  Minimal: "from-gray-300 to-gray-400",
};

interface TemplateCardProps {
  template: Template;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const gradient =
    CATEGORY_GRADIENTS[template.category] ?? CATEGORY_GRADIENTS.General;

  const stats = [
    template.tokenCount > 0 && `${template.tokenCount} tokens`,
    template.componentCount > 0 && `${template.componentCount} components`,
    template.typefaceCount > 0 && `${template.typefaceCount} fonts`,
  ].filter(Boolean);

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-150 hover:shadow-md"
    >
      {/* Preview gradient */}
      <div
        className={`h-36 rounded-t-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
      >
        <span className="text-sm font-medium text-white/80">
          {template.category}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900">
          {template.name}
        </h3>
        {template.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {template.description}
          </p>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <p className="mt-3 text-xs text-slate-400">
            {stats.join(" \u00B7 ")}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          {template.isFree ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Free
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-700">
              ${(template.priceCents / 100).toFixed(2)}
            </span>
          )}
          {template.forkCount > 0 && (
            <span className="text-xs text-slate-400">
              {template.forkCount} {template.forkCount === 1 ? "fork" : "forks"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
