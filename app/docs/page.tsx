import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Scan,
  Columns3,
  Sparkles,
  Server,
  Download,
} from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "What is Layout? - Layout Docs",
  description:
    "Layout is the compiler between design systems and AI coding agents. Extract from Figma or websites, refine in a studio editor, serve to AI agents via MCP.",
};

const capabilities = [
  {
    icon: Scan,
    title: "Extract",
    description:
      "Pull design tokens, components, fonts, and screenshots from Figma files or live websites. Layout resolves actual style values automatically — no manual mapping.",
    href: "/docs/walkthrough",
  },
  {
    icon: Columns3,
    title: "Studio",
    description:
      "Three-panel editor: browse extracted tokens on the left, edit DESIGN.md in the centre with an AI chat bar for inline edits, and test components with live preview on the right.",
    href: "/docs/studio",
  },
  {
    icon: Sparkles,
    title: "Explorer",
    description:
      "Generate 2–6 component variants from a single prompt. Compare with and without design context, upload reference images, and push results to Figma as real auto-layout frames.",
    href: "/docs/explorer",
  },
  {
    icon: Server,
    title: "MCP Server",
    description:
      "Install @layoutdesign/context and your AI agent fetches design tokens and checks compliance in real-time. Works with Claude Code, Cursor, Copilot, and Windsurf — no copy-paste needed.",
    href: "/docs/cli",
  },
  {
    icon: Download,
    title: "Export",
    description:
      "Download a ZIP bundle with DESIGN.md, tokens.css, tokens.json, tailwind.config.js, AGENTS.md, and Cursor rules. Or skip the export entirely and use MCP.",
    href: "#export-bundle",
  },
] as const;

export default function GettingStartedPage() {
  const { prev, next } = getAdjacentPages("/docs");

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">What is Layout?</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout is the compiler between design systems and AI coding agents.
          It extracts your tokens, components, and visual patterns from Figma
          or a live website, lets you refine them in a studio editor with AI
          assistance, then serves the result directly to your coding agent via
          MCP — so every component it builds is on-brand, every time.
        </p>
      </div>

      {/* Core Capabilities */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Core Capabilities
        </h2>
        <div className="space-y-4">
          {capabilities.map(({ icon: Icon, title, description, href }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-xl border border-gray-200 px-5 py-4"
            >
              <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Icon size={18} className="text-gray-700" />
              </div>
              <div className="space-y-1">
                <Link
                  href={href}
                  className="text-base font-semibold text-[#0a0a0a] hover:underline"
                >
                  {title}
                </Link>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How It Works</h2>
        <ol className="space-y-4 text-base text-gray-600 leading-relaxed list-none pl-0">
          {[
            {
              step: "Extract",
              desc: "Paste a Figma URL or website URL into Layout and run extraction.",
            },
            {
              step: "Review",
              desc: "Check the extracted tokens in the Source panel. Re-extract if something looks off.",
            },
            {
              step: "Generate",
              desc: 'Click "Generate DESIGN.md" to synthesise the context file from extracted data.',
            },
            {
              step: "Test",
              desc: "Use the Test panel to generate a few components. Check the health score — aim for 80+.",
            },
            {
              step: "Iterate",
              desc: 'Edit DESIGN.md manually or use the AI chat bar to make changes in plain English (e.g. "make buttons square"). Re-test.',
            },
            {
              step: "Export",
              desc: "Download the ZIP bundle and add the relevant files to your project.",
            },
            {
              step: "Build",
              desc: "Your AI coding tool now has the design system as context on every prompt.",
            },
          ].map(({ step, desc }, i) => (
            <li key={step} className="flex items-start gap-4">
              <span className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <span className="font-semibold text-[#0a0a0a]">{step}</span>
                <span className="text-gray-600"> — {desc}</span>
              </div>
            </li>
          ))}
        </ol>
        <Callout type="tip">
          Using the MCP server? You can skip steps 6–7. Your AI agent fetches
          design context automatically — see the{" "}
          <Link
            href="/docs/cli"
            className="text-gray-900 font-medium hover:underline"
          >
            CLI Guide
          </Link>
          .
        </Callout>
      </section>

      {/* Health Score */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Health Score</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The health score (0–100) in the Test panel measures how closely the
          generated code follows your design system:
        </p>
        <div className="space-y-3">
          {[
            {
              range: "80–100",
              colour: "bg-gray-100 text-gray-800 border-gray-200",
              label: "Ready to export",
              desc: "Tokens are being used correctly.",
            },
            {
              range: "50–79",
              colour: "bg-gray-100 text-gray-800 border-gray-200",
              label: "Partial adherence",
              desc: "Review the Anti-Patterns section in DESIGN.md.",
            },
            {
              range: "0–49",
              colour: "bg-gray-100 text-gray-800 border-gray-200",
              label: "Low adherence",
              desc: "Check that DESIGN.md has well-formed CSS code blocks.",
            },
          ].map(({ range, colour, label, desc }) => (
            <div
              key={range}
              className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${colour}`}
            >
              <span className="shrink-0 font-mono text-sm font-bold pt-0.5">
                {range}
              </span>
              <div className="text-sm">
                <span className="font-semibold">{label}</span> — {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Export Bundle */}
      <section id="export-bundle" className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Export Bundle</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you export from Layout, you download a ZIP containing:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  File
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Purpose
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  file: "DESIGN.md",
                  purpose:
                    "Full design system reference — tokens, components, anti-patterns",
                },
                {
                  file: "CLAUDE.md-section.md",
                  purpose: "Drop-in section for your project's CLAUDE.md",
                },
                {
                  file: "AGENTS.md",
                  purpose:
                    "Context for OpenAI Codex, Jules, Factory, Amp (agents.md standard)",
                },
                {
                  file: "tokens.css",
                  purpose: "CSS custom properties for all design tokens",
                },
                {
                  file: ".cursorrules",
                  purpose: "Cursor rules file with Quick Reference context",
                },
                {
                  file: "cursor/rules/design-system.mdc",
                  purpose: "Cursor v0.43+ MDC rules format",
                },
                {
                  file: "tailwind.config.js",
                  purpose:
                    "Tailwind config pre-loaded with extracted token values",
                },
                {
                  file: "tokens.json",
                  purpose:
                    "W3C DTCG-compatible token file for Theo, Style Dictionary, etc.",
                },
              ].map(({ file, purpose }) => (
                <tr key={file} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {file}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          The{" "}
          <Link
            href="/docs/cli"
            className="text-gray-900 font-medium hover:underline"
          >
            MCP server
          </Link>{" "}
          makes manual export optional. Once installed, your AI agent fetches
          tokens and checks compliance on every prompt — no files to manage.
        </Callout>
        <Callout type="info">
          The <strong>Quick Reference</strong> inside{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            DESIGN.md
          </code>{" "}
          (Section 0) is designed to be copy-pasted standalone — it fits within
          tight context budgets and summarises the most critical tokens and
          rules in 50–75 lines.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <div className="space-y-3">
          <Callout type="tip">
            <strong>Narrow the Quick Reference</strong> — If you have a large
            DESIGN.md, Section 0 is the most important part. Keep it focused on
            the 10–15 tokens your AI uses most.
          </Callout>
          <Callout type="tip">
            <strong>Commit DESIGN.md to your repo</strong> — Treat it like any
            other configuration file. Update it when the design system changes.
          </Callout>
          <Callout type="tip">
            <strong>Use the context toggle</strong> — In the Test panel, toggle
            &ldquo;DESIGN.md context: OFF&rdquo; to see what the AI generates
            without your design system. The gap shows you exactly what value the
            context file is providing.
          </Callout>
          <Callout type="tip">
            <strong>Re-extract periodically</strong> — Design systems evolve.
            Re-run extraction after major design updates to keep the context file
            current.
          </Callout>
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next Steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/studio" className="text-gray-900 hover:underline">
              Studio Guide
            </Link>{" "}
            — learn the three-panel editor, extraction options, and test panel in
            depth.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI Guide
            </Link>{" "}
            — set up the MCP server so your AI agent fetches design context
            automatically.
          </li>
        </ul>
      </section>

      {/* Prev / Next navigation */}
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
