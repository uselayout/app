import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Kit Gallery | Layout Docs",
  description:
    "Browse community-shared design-system kits, import any kit into Layout Studio with one click, or publish your own project as a public kit.",
};

export default function KitGalleryPage() {
  const { prev, next } = getAdjacentPages("/docs/kit-gallery");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Kit Gallery</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Kit Gallery is a public catalogue of design-system kits. Import a
          kit into Layout Studio with one click, install it straight into your
          AI agent from the CLI, or publish one of your own projects so others
          can build on it.
        </p>
        <Link
          href="/gallery"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Open the Gallery
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Browsing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Browsing kits</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The gallery at{" "}
          <Link href="/gallery" className="text-gray-900 hover:underline">
            layout.design/gallery
          </Link>{" "}
          lists every public kit. Search by name, filter by tag, and sort by{" "}
          <strong>Featured</strong>, <strong>Top</strong> (most imported), or{" "}
          <strong>New</strong>. Each card shows the kit&apos;s name,
          description, tags, and import count.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Open any kit to see three tabs:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Live Preview</strong> — a brand-faithful showcase
            (palette, typography, spacing, and components) rendered with the
            kit&apos;s own tokens, so Linear looks like Linear.
          </li>
          <li>
            <strong>Tokens</strong> — the full W3C DTCG token set with colour
            swatches, type scale, spacing bars, radius samples, and shadows.
          </li>
          <li>
            <strong>layout.md</strong> — the generated context file an AI agent
            consumes.
          </li>
        </ul>
      </section>

      {/* Importing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Importing a kit</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Into Layout Studio
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              On any kit page, click <strong>Import to Studio</strong>. The kit
              becomes a new project in your current organisation with its
              tokens, layout.md, and (for rich kits) fonts, branding assets, and
              context documents already in place. Edit it like any other
              project.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Into your AI agent (CLI)
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Run the install command shown on the kit page:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] px-4 py-3 text-sm text-gray-100">
              <code>npx @layoutdesign/context install &lt;kit-slug&gt;</code>
            </pre>
            <p className="text-base text-gray-600 leading-relaxed">
              This writes the kit into a local{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                .layout/
              </code>{" "}
              directory and wires up the MCP server for Claude Code, Cursor,
              Windsurf, and the others. See the{" "}
              <Link href="/docs/cli" className="text-gray-900 hover:underline">
                CLI guide
              </Link>{" "}
              for details.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Use the kit as a UI theme
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Every kit is also published as a shadcn theme, compiled on
              request from its tokens. Install it with either the shadcn CLI
              or ours:
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] px-4 py-3 text-sm text-gray-100">
              <code>npx shadcn add https://layout.design/r/&lt;kit-slug&gt;/theme.json</code>
            </pre>
            <p className="text-base text-gray-600 leading-relaxed">
              This re-skins a stock shadcn project or a{" "}
              <Link href="/docs/layout-ui" className="text-gray-900 hover:underline">
                Layout UI
              </Link>{" "}
              project to match that kit&apos;s colours, radii, and shadows.
              See the{" "}
              <Link href="/docs/layout-ui" className="text-gray-900 hover:underline">
                Layout UI
              </Link>{" "}
              page for details.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Install with shadcn (full kit)
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Registry-enabled kits are also published as full shadcn
              registry items, so the stock shadcn CLI can install the whole
              kit: token CSS variables plus the{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                .layout/
              </code>{" "}
              files the Layout MCP server reads.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] px-4 py-3 text-sm text-gray-100">
              <code>npx shadcn add https://layout.design/api/public/kits/&lt;kit-slug&gt;/registry</code>
            </pre>
            <p className="text-base text-gray-600 leading-relaxed">
              Kits with a registry enabled show the command on their gallery
              page. If the endpoint returns 404, the kit has not been
              registry-enabled yet.
            </p>
          </div>
        </div>
        <Callout type="info">
          Rich kits are imported in full by Studio users. CLI users always
          receive the minimal bundle (tokens + layout.md), which is all an AI
          coding agent needs for on-brand output.
        </Callout>
      </section>

      {/* Sharing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Publishing your own kit
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Open a project in the Studio and click <strong>Share</strong> in the
          top bar to open the <strong>Share to Gallery</strong> dialog. Fill in:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Field</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  What it does
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Name & Description",
                  "Shown on the gallery card. Click \"Generate with AI\" to draft a description and tags from your design system.",
                ],
                [
                  "Tags",
                  "Comma-separated, up to 12. Used for filtering and search.",
                ],
                [
                  "Licence",
                  "MIT, CC-BY-4.0, or a custom licence you paste in. Sets the terms others import under.",
                ],
                [
                  "What's included",
                  "Tokens are always included. Optionally bundle fonts, branding assets, and context documents — adding any of these makes it a \"rich\" kit.",
                ],
                [
                  "Visibility",
                  "Public (listed in the gallery) or Unlisted (reachable only by direct link).",
                ],
              ].map(([field, desc]) => (
                <tr key={field} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                    {field}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          On publish, a bespoke Live Preview is generated for your kit (Claude
          writes a brand-faithful showcase tuned to your tokens, roughly 60
          seconds). The kit goes live with a uniform template first; the bespoke
          showcase replaces it as soon as it lands. Some submissions are
          published immediately; others are queued for a quick review by the
          Layout team before they appear in the gallery.
        </p>
        <Callout type="tip">
          Want a kit that doesn&apos;t exist yet? The{" "}
          <Link
            href="/gallery/wishlist"
            target="_blank"
            className="text-gray-900 hover:underline"
          >
            Wishlist
          </Link>{" "}
          lets anyone request a brand by URL and upvote existing requests, so we
          know which kits to build next.
        </Callout>
      </section>

      {/* Starter kits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Starter kits</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Three starter kits — <code className="text-xs bg-gray-100 rounded px-1 py-0.5">linear-lite</code>,{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">stripe-lite</code>, and{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">notion-lite</code>{" "}
          — ship with the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            CLI
          </Link>{" "}
          and are also available in the gallery. Use them to try the workflow
          end to end before extracting your own design system.
        </p>
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
