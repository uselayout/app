import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Design System Hub | Layout Docs",
  description:
    "The Design System hub is where you curate tokens into roles, add missing values, upload assets, attach product context, and manage snapshots of your design system.",
};

export default function DesignSystemHubPage() {
  const { prev, next } = getAdjacentPages("/docs/design-system");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Design System Hub</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Every project has a <strong>Design System</strong> page that pulls
          tokens, assets, context, and the live layout.md editor into a single
          workspace. Raw extraction is useful, but rarely ready to ship to AI
          agents. The hub is where you curate it.
        </p>
      </div>

      {/* Four tabs */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The four tabs</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Tab</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">What it&apos;s for</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Tokens</td>
                <td className="px-4 py-3 text-gray-600">
                  The curated view. Extracted tokens are assigned to canonical
                  roles (Backgrounds, Text, Borders, Accent, Status, Primitives,
                  Palette, Components). Add, edit, or delete tokens here.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Assets</td>
                <td className="px-4 py-3 text-gray-600">
                  Upload brand logos, wordmarks, favicons, and custom fonts.
                  See{" "}
                  <Link href="/docs/branding" className="text-gray-900 hover:underline">
                    Branding &amp; Assets
                  </Link>{" "}
                  for the full walkthrough.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Context</td>
                <td className="px-4 py-3 text-gray-600">
                  Attach brand voice docs, copy guidelines, and product
                  descriptions that feed into every Explorer generation. See{" "}
                  <Link href="/docs/context-docs" className="text-gray-900 hover:underline">
                    Product Context
                  </Link>.
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Editor</td>
                <td className="px-4 py-3 text-gray-600">
                  The same Monaco editor as the Studio, inline. Handy for
                  quick prose edits to layout.md without leaving the hub.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Curated view */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The curated view</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Extraction produces raw tokens. The curated view is where those raw
          tokens become a design system. Each canonical role is a named slot
          you assign an extracted token to (or leave empty). Agents reading
          <code className="text-sm bg-gray-100 rounded px-1 py-0.5 mx-1">layout.md</code>
          see your curated assignments in <strong>Core Tokens</strong>,
          not the full raw dump.
        </p>

        <div className="rounded-xl border border-gray-200 p-5 space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Role groups</h3>
          <ul className="list-disc pl-6 space-y-1.5 text-gray-600 text-sm">
            <li>
              <strong>Backgrounds</strong> — page, panel, surface, elevated,
              hover.
            </li>
            <li>
              <strong>Text</strong> — primary, secondary, muted, on-accent.
            </li>
            <li>
              <strong>Borders</strong> — subtle, strong, focus.
            </li>
            <li>
              <strong>Accent</strong> — base, hover, subtle, text on accent.
            </li>
            <li>
              <strong>Status</strong> — success, warning, error, info (fill
              and text).
            </li>
            <li>
              <strong>Primitives</strong> — raw hex references used elsewhere.
            </li>
            <li>
              <strong>Palette</strong> — brand and secondary brand colours.
            </li>
            <li>
              <strong>Components</strong> — token slots specific to a component.
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            Each header shows counts like <code className="text-xs bg-gray-100 rounded px-1 py-0.5">BACKGROUNDS 3 of 6 roles</code>
            so you can see at a glance which groups still need coverage.
          </p>
        </div>

        <Callout type="tip">
          The Tokens groupings in the Source Panel now match the curated
          taxonomy exactly. You won&apos;t see Brand/Surfaces in one place and
          Accent/Backgrounds in another.
        </Callout>
      </section>

      {/* Adding tokens */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Adding a token manually</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          If extraction missed something — or you&apos;re working in a blank
          project — click the <strong>+</strong> button on any group. Enter a
          name, value, and (for colours) a mode tag if you want it to appear
          only in light or dark. The new token flows into layout.md and every
          export immediately.
        </p>
        <Callout type="info">
          Custom hex values entered in the role assignment popover also
          persist. They save to the project, not just the session.
        </Callout>
      </section>

      {/* Light/dark */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Light and dark modes</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Tokens extracted from Figma Variables or website selectors like{" "}
          <code className="text-sm bg-gray-100 rounded px-1 py-0.5">[data-theme=&quot;dark&quot;]</code>
          {" "}carry a mode tag. The mode filter pills above the token grid
          let you view one mode at a time. When both modes are populated,
          exports include the dark variant automatically:
        </p>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            tokens.css
          </div>
          <div className="p-4 font-mono text-xs text-gray-800 space-y-2">
            <div>{`:root {`}</div>
            <div className="pl-4">{`--color-bg: #ffffff;`}</div>
            <div className="pl-4">{`--color-text: #0a0a0a;`}</div>
            <div>{`}`}</div>
            <div className="pt-2">{`[data-theme="dark"] {`}</div>
            <div className="pl-4">{`--color-bg: #0a0a0a;`}</div>
            <div className="pl-4">{`--color-text: #ededf4;`}</div>
            <div>{`}`}</div>
            <div className="pt-2">{`@media (prefers-color-scheme: dark) {`}</div>
            <div className="pl-4">{`:root:not([data-theme]) {`}</div>
            <div className="pl-8">{`--color-bg: #0a0a0a;`}</div>
            <div className="pl-8">{`--color-text: #ededf4;`}</div>
            <div className="pl-4">{`}`}</div>
            <div>{`}`}</div>
          </div>
        </div>

        <ul className="list-disc pl-6 space-y-2 text-gray-600 text-sm">
          <li>
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">tokens.json</code>
            {" "}tags mode-scoped entries via{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">$extensions.mode</code>
            {" "}in the W3C DTCG format.
          </li>
          <li>
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">tailwind.config.js</code>
            {" "}picks up the{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">darkMode</code>
            {" "}selector automatically.
          </li>
          <li>
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">layout.md</code>
            {" "}emits a <code className="text-xs bg-gray-100 rounded px-1 py-0.5">:root</code> block and a{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">[data-theme=&quot;dark&quot;]</code>
            {" "}block side by side, so agents can reason about both.
          </li>
        </ul>
      </section>

      {/* Snapshots */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Snapshots and rollback</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The curated view supports named snapshots. Take one before a risky
          re-extraction or a round of manual edits. Snapshots persist
          server-side, so they survive browser refreshes, tab closes, and
          different devices. Roll back any time from the snapshots list.
        </p>
        <Callout type="tip">
          Snapshots are per-project, not per-browser. A teammate can roll
          back a change you made and vice versa.
        </Callout>
      </section>

      {/* Starting blank */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Starting from a blank design system</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          You don&apos;t have to extract from a Figma file or website. On the
          new-project page, pick <strong>Start blank</strong> to create an
          empty kit with all the standard sections. Add tokens by hand, upload
          branding, attach context, and regenerate layout.md when you&apos;re
          ready. This is the right starting point when you&apos;re building a
          design system from scratch rather than codifying an existing one.
        </p>
      </section>

      {/* Editing layout.md directly */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Regenerated sections</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Some sections of layout.md are regenerated every time the file is
          read — Core Tokens, Appendix A, Brand Assets, Icons, Component
          Inventory, and Product Context. The Editor marks these with a
          striped gutter and a subtle background. Edits inside are reverted
          with a toast pointing you to the right tab to make the change
          durable (Tokens, Assets, Context, or the Scanner).
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
