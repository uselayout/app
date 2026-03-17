import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Saved Components - Layout Docs",
  description:
    "Save, browse, and reuse components and pages from the Explorer Canvas in your organisation's library.",
};

export default function ComponentLibraryPage() {
  const { prev, next } = getAdjacentPages("/docs/component-library");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Saved Components</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Save reusable components and full-page designs from the Explorer
          Canvas. Browse them in the Studio&apos;s Source Panel and reuse them
          across your organisation.
        </p>
      </div>

      {/* Features */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Features</h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Feature</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Save from Explorer",
                  "Click \"Add to Library\" on any Explorer Canvas variant to save it as a reusable component or full page.",
                ],
                [
                  "Component / Page types",
                  "Choose whether a saved variant is a component (reusable UI element) or a full page design.",
                ],
                [
                  "Metadata",
                  "Add name, category, description, and tags to each saved variant for easy discovery.",
                ],
                [
                  "Browse in Source Panel",
                  "The \"Saved\" tab in the Studio Source Panel shows all saved components and pages, grouped by category.",
                ],
                [
                  "Filter by type",
                  "Toggle between All, Components, and Pages to find what you need quickly.",
                ],
                [
                  "Organisation-scoped",
                  "Saved components belong to an organisation. All team members can view and use them.",
                ],
              ].map(([feature, description]) => (
                <tr key={feature} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                    {feature}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* How to use */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How to Use</h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              1. Generate Variants
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Use the{" "}
              <Link href="/docs/explorer" className="text-gray-900 hover:underline">
                Explorer Canvas
              </Link>{" "}
              to generate component variants from your design system. Describe
              what you need, attach reference images, and iterate until the
              result looks right.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              2. Save to Library
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Click <strong>Add to Library</strong> on any variant card. Choose
              whether it&apos;s a component or full page, add a name, category,
              description, and tags, then save.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              3. Browse Saved Components
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Open the <strong>Saved</strong> tab in the Studio Source Panel.
              Components and pages are grouped by category. Use the filter pills
              to show All, Components only, or Pages only. Click any item to
              copy its code.
            </p>
          </div>
        </div>
      </section>

      {/* Save from Explorer */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Save from Explorer</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <Link href="/docs/explorer" className="text-gray-900 hover:underline">
            Explorer Canvas
          </Link>{" "}
          generates component variants from your extracted design system. When
          you find a variant worth keeping, click <strong>Add to Library</strong>.
          Fill in the name, type (component or page), category, and tags, then
          save. The variant&apos;s code is stored with your design tokens already
          applied.
        </p>

        <Callout type="tip">
          Saving from the Explorer is the fastest way to build your library.
          Generate multiple variants, pick the best ones, and save them with
          meaningful categories and tags.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-3 text-gray-600">
          <li>
            Components saved from the Explorer Canvas already have design
            tokens applied - you rarely need to edit the token references
            manually.
          </li>
          <li>
            Use categories to group related components (Cards, Navigation,
            Forms, etc.) so the Saved tab stays navigable as your library grows.
          </li>
          <li>
            Separate components from full-page designs using the type toggle
            when saving. This makes filtering easier later.
          </li>
          <li>
            All team members in your organisation share the same library. Agree
            on a naming convention early to avoid duplicates.
          </li>
        </ul>
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between border-t border-gray-200 pt-8">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              {prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              href={next.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {next.title}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
