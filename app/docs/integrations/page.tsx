import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "Integrations — SuperDuper Docs",
  description:
    "Use SuperDuper Studio with Claude Code, Cursor, GitHub Copilot, Windsurf, and OpenAI Codex.",
};

const integrations = [
  {
    name: "Claude Code",
    href: "/docs/integrations/claude-code",
    description:
      "Add the design system to CLAUDE.md so every component Claude generates is on-brand without manual context pasting.",
  },
  {
    name: "Cursor",
    href: "/docs/integrations/cursor",
    description:
      "Use .cursorrules or MDC rules files to inject design system context into every Composer and Chat prompt.",
  },
  {
    name: "GitHub Copilot",
    href: "/docs/integrations/copilot",
    description:
      "Persist design context via .github/copilot-instructions.md so inline completions follow your token system.",
  },
  {
    name: "Windsurf",
    href: "/docs/integrations/windsurf",
    description:
      "Configure windsurf.rules and import tokens.css so Cascade suggestions naturally use the correct token values.",
  },
  {
    name: "OpenAI Codex",
    href: "/docs/integrations/codex",
    description:
      "Drop AGENTS.md into your repo root. Codex reads it automatically on every task — no further setup required.",
  },
];

const tokenFilesSnippet = `/* globals.css or app.css */
@import "./tokens.css";`;

const tailwindSnippet = `// tailwind.config.js — already maps all extracted tokens into Tailwind's theme
const config = require("./tailwind.config.js");`;

export default function IntegrationsPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Integrations</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          SuperDuper works with every major AI coding tool. Export your design
          system bundle once, then drop the right file into each tool — your AI
          assistant will follow the design system on every prompt without you
          having to paste context manually.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {integrations.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-gray-200 p-6 hover:border-indigo-300 transition-colors block"
          >
            <h2 className="text-base font-semibold text-[#0a0a0a] mb-2">
              {item.name}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {item.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Token files</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Regardless of which AI tool you use, adding the token files to your
          codebase makes completions more accurate. Both{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            tokens.css
          </code>{" "}
          and{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            tailwind.config.js
          </code>{" "}
          work with all tools — the AI sees the actual token values in your
          source files, reinforcing the design system rules in context.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            tokens.css — CSS custom properties
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Import in your global stylesheet to make all design tokens available
            as CSS custom properties throughout your project.
          </p>
          <CopyBlock code={tokenFilesSnippet} language="css" />
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            tailwind.config.js — Tailwind theme
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Replace or merge with your existing Tailwind config. All extracted
            tokens are pre-mapped into the Tailwind theme, so your AI-generated
            class names use the correct values.
          </p>
          <CopyBlock code={tailwindSnippet} language="js" />
        </div>

        <Callout type="info">
          <strong>tokens.json</strong> is also included in the export bundle.
          Use it with{" "}
          <a
            href="https://github.com/theo-design/theo"
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Theo
          </a>{" "}
          or{" "}
          <a
            href="https://styledictionary.com"
            className="text-indigo-600 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            Style Dictionary
          </a>{" "}
          to generate platform-specific tokens for iOS, Android, SCSS variables,
          and more.
        </Callout>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-200">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="text-indigo-600 hover:underline text-sm"
            >
              ← {prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              href={next.href}
              className="text-indigo-600 hover:underline text-sm"
            >
              {next.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
