import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Chrome Extension | Layout Docs",
  description:
    "Extract design tokens, inspect elements, check compliance, and push to Figma from any browser tab using the Layout Chrome extension.",
};

export default function ChromeExtensionPage() {
  const { prev, next } = getAdjacentPages("/docs/chrome-extension");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Chrome Extension
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Layout Chrome extension lives in your browser sidebar. Extract
          design tokens from any webpage, inspect elements against your design
          system, check compliance scores, capture screenshots, and push pages
          to Figma. All without leaving the tab you are on.
        </p>
      </div>

      {/* Overview */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Five Tools</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Extract</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Extracts design tokens from the current page: colours, typography,
              spacing, border radius, fonts, CSS variables, and detected CSS
              frameworks. Push the extracted tokens directly to a Layout project
              with one click.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Capture</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Screenshot the current page as viewport, full-page, or a selected
              region. Push the screenshot to your Layout Explorer Canvas where AI
              can rebuild the design using your tokens. Download option also
              available.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Inspect</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Click any element on the page to see its computed styles:
              typography, layout, and visual properties. The extension matches
              each value against your project&apos;s design tokens. Green means
              on-system. Red means off-brand. One click copies the
              element&apos;s HTML and styles, formatted for pasting into an AI
              coding agent.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Comply</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Run a compliance check on the current page against your
              project&apos;s design tokens. Shows a score ring (0 to 100) with a
              per-category breakdown: colours, typography, and spacing. Each
              category lists on-system and off-system counts so you can see
              exactly where a page drifts from the design system.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">Figma</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Send the current webpage to Figma as editable auto-layout frames.
              Select which viewports to capture (desktop, tablet, mobile) and
              optionally provide a Figma file URL to add to an existing file.
              Click{" "}
              <strong className="font-semibold text-[#0a0a0a]">
                Copy Prompt for Claude Code
              </strong>{" "}
              and paste it into Claude Code. It calls the{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                url-to-figma
              </code>{" "}
              MCP tool, which uses Figma&apos;s own capture engine to create
              pixel-perfect editable frames with real auto-layout.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              Requires three MCP servers: Layout MCP (
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                @layoutdesign/context
              </code>
              ), Figma MCP (
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                mcp.figma.com
              </code>
              ), and Playwright MCP.
            </p>
          </div>
        </div>
      </section>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Installation</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          During early access, the Layout team will provide the extension build
          directly. Once published to the Chrome Web Store, installation will be
          a single click. This page will be updated with the store link when
          available.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>
            Download the extension ZIP provided by the Layout team and unzip it
          </li>
          <li>
            Open Chrome and navigate to{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              chrome://extensions
            </code>
          </li>
          <li>
            Enable{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              Developer mode
            </strong>{" "}
            (toggle in the top right)
          </li>
          <li>
            Click{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              Load unpacked
            </strong>{" "}
            and select the unzipped extension folder
          </li>
          <li>
            The Layout icon appears in your Chrome toolbar. Click it to open the
            side panel.
          </li>
        </ol>
        <Callout type="info">
          The extension is not open source. During early access, builds are
          distributed directly by the Layout team. A Chrome Web Store listing is
          coming soon.
        </Callout>
      </section>

      {/* Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The extension connects to your Layout account to push extracted data
          and check compliance against your project&apos;s design tokens.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>
            Open the extension side panel and tap the{" "}
            <strong className="font-semibold text-[#0a0a0a]">Settings</strong>{" "}
            tab at the bottom
          </li>
          <li>
            Enter your Layout API key. Generate one at{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              layout.design &gt; Settings &gt; API Keys
            </strong>
          </li>
          <li>
            If you are running a self-hosted Layout instance, change the{" "}
            <strong className="font-semibold text-[#0a0a0a]">Server URL</strong>{" "}
            to your instance&apos;s address before entering the API key
          </li>
          <li>
            Select your organisation and project from the dropdowns
          </li>
          <li>
            The Home tab now shows quick actions and the current page URL
          </li>
        </ol>
        <Callout type="tip">
          Your API key and server URL are stored locally in Chrome&apos;s
          extension storage. They are never sent to any third party.
        </Callout>
      </section>

      {/* Copy for AI Workflow */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Copy for AI Workflow
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Inspect tool includes a &quot;Copy for AI&quot; button that
          formats the selected element&apos;s HTML and computed styles into a
          structured prompt. Paste it directly into Claude Code, Cursor, or any
          AI coding agent. The agent receives the exact element markup, its
          computed CSS values, and which design tokens it matches, giving it
          enough context to recreate the element on-brand.
        </p>
        <ol className="list-decimal pl-6 space-y-2 text-gray-600">
          <li>Open the Inspect tool in the side panel</li>
          <li>Click any element on the page to select it</li>
          <li>
            Review the computed styles and token matches in the side panel
          </li>
          <li>
            Click{" "}
            <strong className="font-semibold text-[#0a0a0a]">
              Copy for AI
            </strong>
          </li>
          <li>Paste into your AI coding agent&apos;s prompt</li>
        </ol>
      </section>

      {/* Compliance Scoring */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Compliance Scoring
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Comply tool analyses the current page against the design tokens in
          your connected Layout project. It checks colours, typography, and
          spacing values used on the page and reports how many are on-system
          versus off-system.
        </p>
        <div className="space-y-3">
          {[
            {
              range: "80 - 100",
              label: "Strong adherence",
              desc: "Most values match the design system. Minor off-system values are likely intentional.",
            },
            {
              range: "50 - 79",
              label: "Partial adherence",
              desc: "Some values drift from the system. Review the per-category breakdown.",
            },
            {
              range: "0 - 49",
              label: "Low adherence",
              desc: "Significant drift. The page may be using hardcoded values or an outdated design system.",
            },
          ].map(({ range, label, desc }) => (
            <div
              key={range}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 px-4 py-3"
            >
              <span className="shrink-0 font-mono text-sm font-bold pt-0.5">
                {range}
              </span>
              <div className="text-sm">
                <span className="font-semibold">{label}</span>. {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Troubleshooting</h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              problem: "Side panel does not open",
              fix: "Ensure the extension is enabled in chrome://extensions. Try clicking the Layout icon in the toolbar, then selecting \"Open side panel\". Some Chrome versions require pinning the extension first.",
            },
            {
              problem: "Extract returns no tokens",
              fix: "The page may be using inline styles or a CSS-in-JS library that injects styles at runtime. Try waiting for the page to fully load before extracting. Pages behind authentication walls may also block content script access.",
            },
            {
              problem: "Inspect shows no token matches",
              fix: "Token matching requires a connected Layout project with extracted design tokens. Go to Settings, verify your API key is valid, and select a project that has completed extraction.",
            },
            {
              problem: "Comply shows 0 score",
              fix: "Ensure the connected project has design tokens. If the project was created but never extracted, there are no tokens to check against. Run an extraction in Layout Studio first.",
            },
            {
              problem: "Figma push fails",
              fix: "Check that your Figma access token is valid and has write permissions. The file key must match an existing Figma file you have edit access to. Generate a new token at Figma > Settings > Account > Personal access tokens.",
            },
            {
              problem: "Extension not working on certain pages",
              fix: "Chrome extensions cannot inject content scripts into chrome:// pages, the Chrome Web Store, or pages with strict Content Security Policies. Try on a standard webpage.",
            },
          ].map(({ problem, fix }) => (
            <div key={problem} className="px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-[#0a0a0a]">{problem}</p>
              <p className="text-sm text-gray-600">{fix}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            Use Extract on competitor sites or design references to quickly
            capture their token systems into Layout for comparison
          </li>
          <li>
            Comply is useful for auditing client sites before a redesign. Run it
            on multiple pages to get a baseline compliance score
          </li>
          <li>
            The Inspect tool&apos;s &quot;Copy for AI&quot; output includes CSS
            variable names where detected, giving your AI agent concrete token
            references
          </li>
          <li>
            Capture screenshots and push them to the Explorer Canvas where AI
            can recreate the design using your own tokens
          </li>
          <li>
            The extension works alongside Layout Studio. Extract tokens from a
            live site in the extension, then generate DESIGN.md from them in the
            Studio
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
