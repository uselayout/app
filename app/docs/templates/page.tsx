import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Templates - Layout Docs",
  description:
    "Publish and browse reusable design system templates across teams with the Layout Template Marketplace.",
};

export default function TemplatesPage() {
  const { prev, next } = getAdjacentPages("/docs/templates");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Template Marketplace
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Publish and browse reusable design system templates across teams.
          Templates let you share a proven design system as a starting point -
          install one to create a new project pre-populated with tokens,
          components, and documentation.
        </p>
      </div>

      {/* Publishing Templates */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Publishing Templates
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Any project in your organisation can be published as a template. Once
          published, it appears in the marketplace for others to browse and
          install.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>
            Go to{" "}
            <span className="font-medium text-gray-800">
              Settings &gt; Templates
            </span>{" "}
            in your organisation dashboard
          </li>
          <li>Select a project to publish as a template</li>
          <li>Add a display name, description, and category</li>
          <li>
            Choose visibility (
            <span className="font-medium text-gray-800">public</span> or{" "}
            <span className="font-medium text-gray-800">
              organisation-only
            </span>
            )
          </li>
          <li>
            Click{" "}
            <span className="font-medium text-gray-800">Publish</span> - the
            template becomes available in the marketplace
          </li>
        </ol>
        <Callout type="info">
          Only project owners and organisation admins can publish templates.
          Organisation-only templates are visible solely to members of your
          organisation.
        </Callout>
      </section>

      {/* Browsing and Installing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Browsing and Installing
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Templates page lists all public templates alongside any
          organisation-only templates available to you.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>
            Navigate to the{" "}
            <Link href="/templates" className="text-gray-900 hover:underline">
              Templates
            </Link>{" "}
            page from the main navigation
          </li>
          <li>
            Browse available templates with search and category filters
          </li>
          <li>
            Preview a template to see included tokens, components, and
            documentation
          </li>
          <li>
            Click{" "}
            <span className="font-medium text-gray-800">Install</span> to
            create a new project pre-populated with the template&apos;s design
            system
          </li>
          <li>Customise the installed template to match your brand</li>
        </ol>
      </section>

      {/* Template Contents */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Template Contents
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you install a template, you get a fully populated project
          containing:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Content
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Design tokens",
                  "All extracted colours, typography, spacing, effects, and border radius values",
                ],
                [
                  "DESIGN.md",
                  "The generated LLM-optimised design system document, ready for AI agents",
                ],
                [
                  "Component specifications",
                  "Usage rules, variant inventory, and code examples for each component",
                ],
                [
                  "Anti-pattern rules",
                  "Documented patterns the design system explicitly prohibits",
                ],
              ].map(([content, description]) => (
                <tr key={content} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap align-top pt-3.5">
                    {content}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="tip">
          After installing a template, open the project in Studio to review the
          extracted tokens and regenerate DESIGN.md if you need a customised
          version for your brand.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            Templates are a fast way to bootstrap a new project with a proven
            design system - useful when starting a product that should match an
            established brand
          </li>
          <li>
            Published templates can be updated - subscribers get notified of
            new versions so installed projects stay current
          </li>
          <li>
            Use category filters to find templates matching your project type
            (SaaS, marketing, documentation, etc.)
          </li>
          <li>
            Organisation-only templates are ideal for enforcing a shared design
            language across multiple internal products
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
