import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Branding & Assets | Layout Docs",
  description:
    "Upload logos, wordmarks, favicons, and custom fonts to your Layout project. AI variants reference brand assets directly.",
};

export default function BrandingPage() {
  const { prev, next } = getAdjacentPages("/docs/branding");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Branding &amp; Assets</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Assets tab on the Design System hub holds your brand identity:
          logos, wordmarks, favicons, and custom fonts. Everything uploaded
          here is exported in the AI kit and referenced by Explorer variants.
        </p>
      </div>

      {/* What you can upload */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">What you can upload</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Asset</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Formats</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Primary logo</td>
                <td className="px-4 py-3 text-gray-600">SVG, PNG</td>
                <td className="px-4 py-3 text-gray-600">Used wherever a variant needs &ldquo;the logo&rdquo;. Upload light and dark versions.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Wordmark</td>
                <td className="px-4 py-3 text-gray-600">SVG, PNG</td>
                <td className="px-4 py-3 text-gray-600">Typographic-only logo. Variants fall back to this in tight headers.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Favicon</td>
                <td className="px-4 py-3 text-gray-600">SVG, PNG, ICO</td>
                <td className="px-4 py-3 text-gray-600">Square. Used in browser-chrome mockups and tab previews.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">Custom fonts</td>
                <td className="px-4 py-3 text-gray-600">.woff2, .woff, .ttf, .otf</td>
                <td className="px-4 py-3 text-gray-600">Max 5 MB per file. Injected into previews, exported with the kit.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* How variants reference brand assets */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How variants reference brand assets</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Explorer generations that need your logo render it as an{" "}
          <code className="text-sm bg-gray-100 rounded px-1 py-0.5">&lt;img&gt;</code>
          {" "}tag with a <code className="text-sm bg-gray-100 rounded px-1 py-0.5">data-brand-logo</code> attribute.
          The preview pipeline swaps in the real uploaded asset before
          rendering, so you see your actual logo in place of the placeholder.
        </p>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Generated variant TSX
          </div>
          <div className="p-4 font-mono text-xs text-gray-800 space-y-1">
            <div>{`<header className="...">`}</div>
            <div className="pl-4">{`<img data-brand-logo="primary" alt="Logo" />`}</div>
            <div className="pl-4">{`<nav>...</nav>`}</div>
            <div>{`</header>`}</div>
          </div>
        </div>

        <Callout type="tip">
          Upload light and dark variants of the primary logo. Variants in dark
          mode will automatically pick the dark logo when rendering.
        </Callout>
      </section>

      {/* In the export */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">In the exported AI kit</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you export the bundle, brand assets appear in two places:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>/assets/</strong> — the raw files (SVGs, PNGs, fonts),
            referenced by relative paths in layout.md.
          </li>
          <li>
            <strong>layout.md</strong> — a generated <em>Brand Assets</em>{" "}
            section lists every uploaded file with its filename, type, and
            when to use it. Agents read this before writing JSX that needs a
            logo or wordmark.
          </li>
        </ul>
      </section>

      {/* Custom fonts */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Custom fonts</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Drag a <code className="text-sm bg-gray-100 rounded px-1 py-0.5">.woff2</code> (or other supported font file) into
          the Assets tab. Layout will:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>Generate the <code className="text-xs bg-gray-100 rounded px-1 py-0.5">@font-face</code> declaration and inject it into every preview.</li>
          <li>Include the file in the exported ZIP under <code className="text-xs bg-gray-100 rounded px-1 py-0.5">/assets/fonts/</code>.</li>
          <li>Make the font name resolvable in typography tokens, so Cursor, Claude Code, and others can reference it by name.</li>
        </ul>
        <Callout type="info">
          System fonts are auto-detected during extraction. Custom fonts must
          be uploaded here to travel with the kit.
        </Callout>
      </section>

      {/* Related */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Related</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/design-system" className="text-gray-900 hover:underline">
              Design System Hub
            </Link>{" "}— the Tokens, Assets, Context, and Editor tabs in one workspace.
          </li>
          <li>
            <Link href="/docs/context-docs" className="text-gray-900 hover:underline">
              Product Context
            </Link>{" "}— attach brand voice and copy guidelines alongside visual assets.
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
