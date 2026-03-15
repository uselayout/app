import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Component Library - Layout Docs",
  description:
    "Create, version, and manage reusable components per organisation with the Layout Component Library.",
};

export default function ComponentLibraryPage() {
  const { prev, next } = getAdjacentPages("/docs/component-library");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Component Library</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Create, version, and manage reusable components per organisation.
          The library gives your team a shared, living catalogue of on-brand UI
          components - all backed by your extracted design system tokens.
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
                  "Create components",
                  "Write TSX code in a Monaco editor with live preview on the right.",
                ],
                [
                  "AI-assisted editing",
                  "Chat bar at the bottom of the editor. Type a prompt and press Cmd+Enter to generate or modify code with AI.",
                ],
                [
                  "Versioning",
                  "Components are versioned automatically. View the full version history and restore any previous version.",
                ],
                [
                  "Metadata",
                  "Add name, category, description, and tags to each component for easy discovery.",
                ],
                [
                  "Promote from Explorer",
                  "Variants from the Explorer Canvas can be promoted directly to the library with design tokens already applied.",
                ],
                [
                  "Organisation-scoped",
                  "Components belong to an organisation. All team members can view and use them.",
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
              1. Open the Library
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Navigate to <strong>Library</strong> in the dashboard sidebar. You
              will see the component grid for your organisation, including any
              components already in the catalogue.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              2. Create a Component
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Click <strong>Create Component</strong> to open the editor. The
              left side is a Monaco editor with TSX syntax highlighting; the
              right side is a live preview that updates as you type.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              3. Use the AI Chat Bar
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              At the bottom of the editor is an AI chat bar. Type a plain-language
              prompt describing what you want - for example,{" "}
              <em>&quot;add a hover state that lifts the card&quot;</em> - then
              press <strong>Cmd+Enter</strong>. The AI will generate or modify
              the code in context, using your design system tokens.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              4. Add Metadata
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Fill in the component name, category, description, and tags. Tags
              are especially useful for filtering the library grid by function -
              navigation, forms, layout, and so on.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              5. Save and Manage
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Click <strong>Save</strong> to add the component to your library.
              Each save creates a new version automatically. To edit an existing
              component, click it in the library grid to reopen the editor with
              the full version history available on the right.
            </p>
          </div>
        </div>
      </section>

      {/* Versioning */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Versioning</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Every save produces a new version. The version history panel lists all
          versions in reverse chronological order with a timestamp and the first
          line of the commit diff. Click any version to preview it, then click
          <strong> Restore</strong> to make it the current working copy.
        </p>

        <Callout type="info">
          Restoring a version does not delete newer versions - it creates a new
          version whose content matches the restored one. Your history is always
          append-only.
        </Callout>
      </section>

      {/* Promote from Explorer */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Promote from Explorer</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <Link href="/docs/explorer" className="text-gray-900 hover:underline">
            Explorer Canvas
          </Link>{" "}
          generates component variants from your extracted design system. When
          you find a variant you want to keep, click <strong>Promote to Library</strong>.
          The component opens in the editor pre-populated with the generated TSX
          and the design tokens already wired in - ready to name, tag, and save.
        </p>

        <Callout type="tip">
          Promoting from Explorer is the fastest way to build your library.
          Start in the Explorer, iterate on variants until they look right, then
          promote the ones worth keeping.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-3 text-gray-600">
          <li>
            Components promoted from the Explorer Canvas already have design
            tokens applied - you rarely need to edit the token references
            manually.
          </li>
          <li>
            Use tags to organise components by function (navigation, forms,
            layout, etc.) so the grid stays navigable as your library grows.
          </li>
          <li>
            The AI chat understands your design system context when generating
            code - describe the behaviour you want in plain language rather than
            specifying exact CSS values.
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
