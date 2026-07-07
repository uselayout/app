import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "Cursor | Layout Docs",
  description:
    "Inject your Layout design system into Cursor: the CLI registers the MCP server and creates .cursor/rules automatically, or copy the MDC rules from your export bundle.",
};

const cliInstallSnippet = `npx @layoutdesign/context install --target cursor`;

const cliExportSnippet = `npx @layoutdesign/context export --format cursor`;

const mdcCopySnippet = `mkdir -p .cursor/rules
cp path/to/export/.cursor/rules/design-system.mdc .cursor/rules/design-system.mdc
cp path/to/export/.cursor/rules/components.mdc .cursor/rules/components.mdc`;

const mdcFrontmatterSnippet = `---
description: Design system rules
globs: ["**/*.tsx", "**/*.css"]
alwaysApply: false
---

<!-- Design system context here -->`;

const composerExampleSnippet = `Build a primary button following our design system`;

export default function CursorPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/cursor");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Cursor</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Cursor reads project rules from{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            .cursor/rules
          </code>{" "}
          and MCP servers from{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            .cursor/mcp.json
          </code>
          . Layout sets up both: the rules inject your design system into every
          Composer and Chat prompt, and the MCP server gives the agent live
          access to tokens, component specs, and compliance checking.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Option A: the CLI (recommended)
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            One command registers the Layout MCP server in{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              .cursor/mcp.json
            </code>{" "}
            and <strong>creates</strong>{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              .cursor/rules/layout.mdc
            </code>{" "}
            (and AGENTS.md) from your loaded kit when they do not exist yet:
          </p>
          <CopyBlock code={cliInstallSnippet} language="bash" />
          <p className="text-base text-gray-600 leading-relaxed">
            If a legacy{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              .cursorrules
            </code>{" "}
            file already exists, the CLI augments it instead of creating the
            MDC rule. To regenerate just the Cursor rule at any time:
          </p>
          <CopyBlock code={cliExportSnippet} language="bash" />
          <Callout type="info">
            Cursor&apos;s marketplace listing for MCP servers is
            submission-based; Layout&apos;s listing is in the submission
            pipeline. The CLI install above gives you the identical MCP setup
            today, no marketplace required.
          </Callout>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Option B: MDC rules from the export bundle
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            The Studio export bundle includes two MDC rules files, which offer
            finer control over when rules are applied. Copy them into your
            project:
          </p>
          <CopyBlock code={mdcCopySnippet} language="bash" />
          <p className="text-base text-gray-600 leading-relaxed">
            MDC rules support a frontmatter{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              globs
            </code>{" "}
            field to scope when the rules apply. Open the file and adjust it if
            needed. For example, to target only TypeScript and CSS files:
          </p>
          <CopyBlock code={mdcFrontmatterSnippet} language="markdown" />
          <Callout type="tip">
            Scoping to{" "}
            <code className="font-mono text-xs">["**/*.tsx", "**/*.css"]</code>{" "}
            keeps design system context out of non-UI files (config, tests,
            scripts) and helps Cursor stay focused on the right rules.
          </Callout>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Using in Cursor Composer
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            With either rules file in place, Cursor Composer will automatically
            follow the design system on every generation. You can also reference
            it explicitly to reinforce the intent:
          </p>
          <CopyBlock code={composerExampleSnippet} language="text" />
          <p className="text-base text-gray-600 leading-relaxed">
            Chat works the same way. The design context is present on every
            message without you having to paste it manually.
          </p>
          <Callout type="info">
            For the most accurate completions, also add{" "}
            <code className="font-mono text-xs">tokens.css</code> to your
            project and import it in your global stylesheet. Cursor picks up
            context from open files, so keeping{" "}
            <code className="font-mono text-xs">layout.md</code> open in a tab
            further improves output quality.
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
