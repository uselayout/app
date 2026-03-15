import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "OpenAI Codex -  Layout Docs",
  description:
    "Add AGENTS.md to your repo so OpenAI Codex follows your design system on every task.",
};

const copyAgentsMdSnippet = `cp path/to/export/AGENTS.md AGENTS.md`;

const monorepoStructureSnippet = `AGENTS.md                     # global project rules (design system)
packages/
  web/
    AGENTS.override.md        # web-specific rules (override the root)
  mobile/
    AGENTS.override.md        # mobile-specific rules`;

const globalInstructionsSnippet = `mkdir -p ~/.codex
cp path/to/export/AGENTS.md ~/.codex/AGENTS.md`;

export default function CodexPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/codex");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">OpenAI Codex</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Codex reads{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            AGENTS.md
          </code>{" "}
 -  an open standard context file supported by Codex, Cursor, Google
          Jules, Factory, Amp, and other agents that follow the{" "}
          <a
            href="https://agents.md"
            className="text-gray-900 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            agents.md
          </a>{" "}
          spec. Set it up once and it works across all compatible tools.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 1 -  Copy AGENTS.md to your project root
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Copy{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  AGENTS.md
                </code>{" "}
                from your export bundle to the root of your project:
              </p>
              <CopyBlock code={copyAgentsMdSnippet} language="bash" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 2 -  Commit to your repo
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Commit the file. Codex reads it automatically on every task - 
                no further configuration required.
              </p>
            </div>
          </div>

          <Callout type="tip">
            That&apos;s it. Codex will follow the design system rules in every
            UI component it generates. The same file is also read by Cursor,
            Google Jules, Factory, and Amp -  one file covers all of them.
          </Callout>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Advanced: subdirectory overrides
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            In a monorepo or multi-package project, you can add more specific
            rules closer to the code. Any{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              AGENTS.override.md
            </code>{" "}
            file takes precedence over{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              AGENTS.md
            </code>{" "}
            at the same directory level:
          </p>
          <CopyBlock code={monorepoStructureSnippet} language="text" />
          <p className="text-base text-gray-600 leading-relaxed">
            This lets you set global design system rules at the root while
            overriding specific behaviour for packages that have different
            conventions -  for example, a mobile package using React Native
            styling instead of CSS custom properties.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Global instructions
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            To apply your design system across all Codex sessions regardless of
            which project you are working in, copy{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              AGENTS.md
            </code>{" "}
            to the global Codex config directory:
          </p>
          <CopyBlock code={globalInstructionsSnippet} language="bash" />
          <Callout type="info">
            Global instructions in{" "}
            <code className="font-mono text-xs">~/.codex/AGENTS.md</code> are
            merged with project-level{" "}
            <code className="font-mono text-xs">AGENTS.md</code> files. Project
            rules take precedence when there is a conflict.
          </Callout>
        </div>
      </div>

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between pt-8 border-t border-gray-200">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="text-gray-900 hover:underline text-sm"
            >
              ← {prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              href={next.href}
              className="text-gray-900 hover:underline text-sm"
            >
              {next.title} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
