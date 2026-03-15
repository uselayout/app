import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Figma Plugin - Layout Docs",
  description:
    "Native Figma plugin for extracting design systems, inspecting tokens, and pushing to Layout Cloud - all without leaving Figma.",
};

export default function FigmaPluginPage() {
  const { prev, next } = getAdjacentPages("/docs/figma-plugin");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Figma Plugin</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Native Figma plugin for extracting design systems, inspecting tokens,
          and pushing to Layout Cloud - all without leaving Figma.
        </p>
      </div>

      {/* Key Differences */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Key Differences from Web Extraction
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Feature
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Plugin
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Web Studio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "API Access",
                  "Direct Figma Plugin API",
                  "REST API (needs access token)",
                ],
                [
                  "Local Styles",
                  "Reads local (unpublished) styles",
                  "Published styles only",
                ],
                [
                  "Variables",
                  "Works on all plans",
                  "Enterprise plans only",
                ],
                [
                  "Selection Context",
                  "Knows what designer is looking at",
                  "No selection awareness",
                ],
                ["Speed", "Instant extraction", "~30 seconds"],
              ].map(([feature, plugin, web]) => (
                <tr key={feature} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                    {feature}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{plugin}</td>
                  <td className="px-4 py-3 text-gray-600">{web}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Plugin Panels */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Plugin Panels</h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Export</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              One-click AI Kit export. Extracts all design tokens (colours,
              typography, spacing, effects, border radius) and components from
              the current file. Download as ZIP or push directly to Layout
              Cloud.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Inspector</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Select any element in Figma to see which design tokens it maps
              to. Highlights values that don&apos;t match any token (potential
              drift). Copy token names and values with one click.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Health</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Run a DESIGN.md completeness check from within Figma. See scores
              per category with actionable suggestions for improving coverage.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Canvas</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Capture a component or frame as a screenshot with token context.
              Push it to Layout&apos;s Explorer Canvas where AI rebuilds it
              using your design system tokens and generates multiple variants.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Settings</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Configure your Layout API key and server URL. Supports
              self-hosted Layout instances. API key is stored securely in
              Figma&apos;s client storage.
            </p>
          </div>
        </div>
      </section>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Installation</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Search &quot;Layout&quot; in Figma&apos;s plugin browser (coming
          soon), or for development:
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>Clone the plugin repository</li>
          <li>
            Run{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              npm install &amp;&amp; npm run build
            </code>
          </li>
          <li>
            In Figma: Plugins &gt; Development &gt; Import plugin from manifest
          </li>
          <li>
            Select{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              manifest.json
            </code>{" "}
            from the cloned repo
          </li>
        </ol>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            The plugin extracts local styles that aren&apos;t available via the
            REST API
          </li>
          <li>
            Use the Inspector to spot drift before it reaches production
          </li>
          <li>
            Push to Canvas lets designers trigger AI variant generation without
            leaving Figma
          </li>
          <li>
            The plugin stores your API key in Figma&apos;s client storage - it
            never leaves your machine
          </li>
        </ul>

        <Callout type="info">
          The plugin reads local (unpublished) styles and works with Variables
          on all Figma plans - two significant advantages over the REST API
          approach used by the Web Studio.
        </Callout>
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
