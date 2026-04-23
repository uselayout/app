import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Product Context | Layout Docs",
  description:
    "Attach brand voice, copy guidelines, and product descriptions to a Layout project. Context files feed into every Explorer generation alongside design tokens.",
};

export default function ContextDocsPage() {
  const { prev, next } = getAdjacentPages("/docs/context-docs");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Product Context</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Design tokens tell an AI agent <em>how your product looks</em>.
          Context documents tell it <em>what your product is</em>. Upload
          brand voice guidelines, copy principles, product descriptions, or
          tone-of-voice docs and every Explorer generation will read them.
        </p>
      </div>

      {/* What to upload */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">What to upload</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Short, specific documents work best. Examples:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>brand-voice.md</strong> — tone, personality, words you use
            and avoid.
          </li>
          <li>
            <strong>product-one-pager.md</strong> — who you serve, what the
            product does, the three value props.
          </li>
          <li>
            <strong>copy-guidelines.md</strong> — button verbs, sentence case
            vs title case, empty-state patterns.
          </li>
          <li>
            <strong>terminology.md</strong> — domain language (e.g. &ldquo;orders&rdquo; vs &ldquo;bookings&rdquo;, &ldquo;patients&rdquo; vs &ldquo;clients&rdquo;).
          </li>
        </ul>
        <Callout type="tip">
          Context docs are most useful for copy, not visuals. Variants
          generated with a brand-voice doc attached produce noticeably more
          on-brand microcopy in the first draft.
        </Callout>
      </section>

      {/* Limits */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Limits</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Limit</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a]">Max files per project</td>
                <td className="px-4 py-3 text-gray-600">3</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a]">Max size per file</td>
                <td className="px-4 py-3 text-gray-600">50 KB</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a]">Accepted formats</td>
                <td className="px-4 py-3 text-gray-600">.md, .txt</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-600">
          Oversized or surplus uploads return a friendly error naming the
          file and the limit (for example:{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">Context file brand-voice.md is 82KB. Each file must be &le; 50KB.</code>).
        </p>
      </section>

      {/* How they flow */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How context reaches generations</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          On every Explorer prompt, Layout concatenates the context documents
          into a <strong>Product Context</strong> section of the prompt, sent
          alongside the design tokens. The same section is written into
          exported <code className="text-sm bg-gray-100 rounded px-1 py-0.5">layout.md</code>, so MCP-connected agents (Claude Code, Cursor,
          Copilot, Windsurf, Codex) also see it when they call{" "}
          <code className="text-sm bg-gray-100 rounded px-1 py-0.5">get_design_system</code>.
        </p>
        <Callout type="info">
          You don&apos;t need to reference the context docs in your prompt.
          They are always on.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            Prefer plain prose and bullet lists. Agents handle structured
            markdown better than HTML or screenshots.
          </li>
          <li>
            Keep each file under one screen of text. Three short focused docs
            beat one sprawling document.
          </li>
          <li>
            If you have a style guide, excerpt the rules you actually want
            enforced. Full style guides often bury rules in examples.
          </li>
          <li>
            Update docs in place and re-save. No re-extraction needed.
          </li>
        </ul>
      </section>

      {/* Related */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Related</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/design-system" className="text-gray-900 hover:underline">
              Design System Hub
            </Link>
          </li>
          <li>
            <Link href="/docs/branding" className="text-gray-900 hover:underline">
              Branding &amp; Assets
            </Link>
          </li>
          <li>
            <Link href="/docs/explorer" className="text-gray-900 hover:underline">
              Explorer
            </Link>{" "}— where context docs have the most visible impact.
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
