import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "Claude Code — SuperDuper Docs",
  description:
    "Add your SuperDuper design system to CLAUDE.md so Claude Code generates on-brand components on every prompt.",
};

const claudeMdSnippet = `## Design System

<!-- Paste CLAUDE.md-section.md contents here -->`;

const contextFlagSnippet = `claude --context DESIGN.md`;

const repoReferenceSnippet = `## Design System

See DESIGN.md for full design system reference.`;

export default function ClaudeCodePage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/claude-code");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Claude Code</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Claude Code reads your project&apos;s{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            CLAUDE.md
          </code>{" "}
          as persistent context on every prompt. Add the design system there so
          every component Claude generates is on-brand — no manual context
          pasting required.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 1 — Open or create CLAUDE.md
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Open your project&apos;s{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  CLAUDE.md
                </code>{" "}
                in the project root. If the file does not exist yet, create it:
              </p>
              <CopyBlock code="touch CLAUDE.md" language="bash" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 2 — Paste the design system section
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Copy the contents of{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  CLAUDE.md-section.md
                </code>{" "}
                from your export bundle and paste it into a{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  ## Design System
                </code>{" "}
                section:
              </p>
              <CopyBlock code={claudeMdSnippet} language="markdown" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 3 — Reference or inject the full DESIGN.md
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                For the full{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  DESIGN.md
                </code>
                , you have two options:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Add it to your repo</strong> and reference it from{" "}
                  <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    CLAUDE.md
                  </code>
                  :
                </li>
              </ul>
              <CopyBlock code={repoReferenceSnippet} language="markdown" />
              <ul className="list-disc pl-6 space-y-2 text-gray-600">
                <li>
                  <strong>Inject it per-session</strong> using the{" "}
                  <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                    --context
                  </code>{" "}
                  flag:
                </li>
              </ul>
              <CopyBlock code={contextFlagSnippet} language="bash" />
            </div>
          </div>
        </div>

        <Callout type="tip">
          The <strong>Quick Reference</strong> (Section 0 of DESIGN.md) is
          designed specifically for{" "}
          <code className="font-mono text-xs">CLAUDE.md</code> — it summarises
          the most critical tokens and rules in 50–75 lines, keeping it concise
          enough to not exhaust your context budget on every message. Add the
          full <code className="font-mono text-xs">DESIGN.md</code> only when
          you need deep token or component reference.
        </Callout>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            How it works in practice
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Once{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              CLAUDE.md
            </code>{" "}
            contains your design system context, Claude Code will automatically
            use your tokens, colour values, typography scale, and component
            patterns in every response — without any extra prompting. You can
            verify this by asking Claude to build a component and checking
            whether it uses your exact token names rather than arbitrary values.
          </p>
          <Callout type="info">
            Commit{" "}
            <code className="font-mono text-xs">CLAUDE.md</code> and{" "}
            <code className="font-mono text-xs">DESIGN.md</code> to your repo.
            Treat them like any other configuration file — update them when your
            design system changes.
          </Callout>
        </div>
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
