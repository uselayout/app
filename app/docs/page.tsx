import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Getting Started -  Layout Docs",
  description:
    "Give your AI coding agent a complete understanding of your design system so every component it builds is on-brand.",
};

export default function GettingStartedPage() {
  const { prev, next } = getAdjacentPages("/docs");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Getting Started</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Every AI coding agent generates UI that looks generic — wrong
          colours, wrong spacing, wrong components. Layout fixes this by
          giving your AI a complete understanding of your design system, so
          every component it builds matches your brand perfectly.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Extract your design tokens and components from Figma or a live
          website, then install the context bundle into your project. Claude
          Code, Cursor, Copilot, and Windsurf use it automatically.
        </p>
      </div>

      {/* What You Get */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">What You Get</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you export from Layout, you download a ZIP containing:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">File</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                {
                  file: "DESIGN.md",
                  purpose:
                    "Full design system reference -  tokens, components, anti-patterns",
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
                  purpose: "Tailwind config pre-loaded with extracted token values",
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
          The <strong>Quick Reference</strong> inside <code className="text-xs bg-gray-100 rounded px-1 py-0.5">DESIGN.md</code> (Section 0) is designed to be
          copy-pasted standalone -  it fits within tight context budgets and
          summarises the most critical tokens and rules in 50–75 lines.
        </Callout>
      </section>

      {/* Recommended Workflow */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Recommended Workflow</h2>
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
              desc: "Use the Test panel to generate a few components. Check the health score -  aim for 80+.",
            },
            {
              step: "Iterate",
              desc: "Edit DESIGN.md manually or use the AI edit bar to make changes in plain English (e.g. \"make buttons square\"). Re-test.",
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
                <span className="text-gray-600"> -  {desc}</span>
              </div>
            </li>
          ))}
        </ol>
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
                <span className="font-semibold">{label}</span> -  {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>
        <div className="space-y-3">
          <Callout type="tip">
            <strong>Narrow the Quick Reference</strong> -  If you have a large
            DESIGN.md, Section 0 is the most important part. Keep it focused on
            the 10–15 tokens your AI uses most.
          </Callout>
          <Callout type="tip">
            <strong>Commit DESIGN.md to your repo</strong> -  Treat it like any
            other configuration file. Update it when the design system changes.
          </Callout>
          <Callout type="tip">
            <strong>Use the context toggle</strong> -  In the Test panel, toggle
            "DESIGN.md context: OFF" to see what the AI generates without your
            design system. The gap shows you exactly what value the context file
            is providing.
          </Callout>
          <Callout type="tip">
            <strong>Re-extract periodically</strong> -  Design systems evolve.
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
 -  learn the three-panel editor, extraction options, and test panel in
            depth.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI Guide
            </Link>{" "}
 -  set up the MCP server so your AI agent fetches design context
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
