import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "CLI Guide — SuperDuper Docs",
  description:
    "Install the @superduperui/context MCP server, import your Studio export, and give your AI agent automatic access to your design system.",
};

export default function CliPage() {
  const { prev, next } = getAdjacentPages("/docs/cli");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">SuperDuper CLI</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            @superduperui/context
          </code>{" "}
          is an open-source, MIT-licensed npm package that serves your design
          system context to AI agents via the Model Context Protocol (MCP). Once
          configured, your AI agent calls{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            get_design_system
          </code>{" "}
          automatically whenever it builds UI — no manual context pasting
          required.
        </p>
      </div>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Installation</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Initialise a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .superduper/
          </code>{" "}
          directory in your project with a free starter kit. No signup required.
        </p>
        <CopyBlock
          code="npx @superduperui/context init --kit linear-lite"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This creates a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .superduper/
          </code>{" "}
          directory containing DESIGN.md and the token files for the chosen
          starter kit. See the{" "}
          <a href="#starter-kits" className="text-indigo-600 hover:underline">
            Free Starter Kits
          </a>{" "}
          section below for all available kit names.
        </p>
        <Callout type="tip">
          After <code className="text-xs bg-emerald-50 rounded px-1 py-0.5">init</code>, run{" "}
          <code className="text-xs bg-emerald-50 rounded px-1 py-0.5">npx @superduperui/context install</code> to
          auto-configure your AI agent&apos;s MCP settings — no manual JSON editing required.
        </Callout>
      </section>

      {/* Importing from Studio */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Importing from Studio</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          If you have already exported a ZIP bundle from SuperDuper Studio,
          import it directly — no need to use a starter kit.
        </p>
        <CopyBlock
          code="npx @superduperui/context import ./export.zip"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This unpacks the bundle into{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .superduper/
          </code>{" "}
          and makes your extracted DESIGN.md and tokens available to the MCP
          server immediately.
        </p>
      </section>

      {/* Starting the MCP Server */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Starting the MCP Server</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Start the local MCP server in your project directory:
        </p>
        <CopyBlock
          code="npx @superduperui/context serve"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The server runs on stdio and responds to MCP tool calls from your
          configured AI agent. No port is opened — communication is via
          standard input/output, which is the MCP convention for local tools.
        </p>
        <Callout type="info">
          Add the MCP server to your agent config once. After that, every
          session in that project directory automatically has access to the
          design system tools — no flags, no manual context injection.
        </Callout>
      </section>

      {/* Auto-configure AI tools */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Auto-Configure AI Tools</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">install</code> command
          automatically writes the MCP server configuration to your AI tool&apos;s settings file:
        </p>
        <CopyBlock
          code="npx @superduperui/context install"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This detects Claude Code, Cursor, and Windsurf and configures whichever are present. To target a specific tool:
        </p>
        <CopyBlock
          code={`npx @superduperui/context install --target claude
npx @superduperui/context install --target cursor
npx @superduperui/context install --target windsurf`}
          language="bash"
        />
      </section>

      {/* Switching kits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Managing Design Kits</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          List all available kits (both free starter kits and any you&apos;ve imported from Studio):
        </p>
        <CopyBlock
          code="npx @superduperui/context list"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Switch to a different kit:
        </p>
        <CopyBlock
          code="npx @superduperui/context use stripe-lite"
          language="bash"
        />
      </section>

      {/* Quickstart */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Quickstart (Studio Export)</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The fastest path from Studio to working AI context is three commands:
        </p>
        <CopyBlock
          code={`npx @superduperui/context import ./superduper-export.zip
npx @superduperui/context install
# Done — your AI agent reads the design system automatically`}
          language="bash"
        />
      </section>

      {/* MCP Tools */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Available MCP Tools</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The MCP server exposes 8 tools your AI agent can call automatically:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Tool</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">What It Does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "get_design_system",
                  "Returns the full DESIGN.md, or a specific section by number",
                ],
                [
                  "get_tokens",
                  "Returns CSS, JSON, or Tailwind token output filtered by type (colour, spacing, etc.)",
                ],
                [
                  "get_component",
                  "Returns the component spec and TSX code example for a named component",
                ],
                [
                  "list_components",
                  "Returns the full inventory of components available in the design system",
                ],
                [
                  "check_compliance",
                  "Validates a code snippet against the design rules and returns violations",
                ],
                [
                  "preview",
                  "Renders a component live in a local browser canvas at localhost:4321",
                ],
                [
                  "push_to_figma",
                  "Sends a rendered component to Figma as editable frames (via Figma MCP)",
                ],
                [
                  "url_to_figma",
                  "Captures a public URL as editable Figma frames with auto-layout (via Figma MCP + Playwright)",
                ],
              ].map(([tool, desc]) => (
                <tr key={tool} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap align-top pt-3.5">
                    {tool}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Free Starter Kits */}
      <section id="starter-kits" className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Free Starter Kits</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Three starter kits are bundled with the package. Each was extracted
          from a live website using Playwright and includes a Quick Reference,
          core tokens, and 5 component specs — enough to get meaningful on-brand
          output immediately.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Kit</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Aesthetic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["linear-lite", "Developer tool, dark-first"],
                ["stripe-lite", "Clean, trust-focused"],
                ["notion-lite", "Document-first, typography-heavy"],
              ].map(([kit, aesthetic]) => (
                <tr key={kit} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-700 whitespace-nowrap">
                    {kit}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{aesthetic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CopyBlock
          code={`# Use any kit name with the init command
npx @superduperui/context init --kit stripe-lite
npx @superduperui/context init --kit notion-lite`}
          language="bash"
        />
      </section>

      {/* Code-to-Design Loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The Code-to-Design Loop</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">preview</code>{" "}
          and{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            push_to_figma
          </code>{" "}
          tools close the full loop between code and design — something no other
          open-source tool currently does:
        </p>
        <CopyBlock
          code={`Developer prompts Claude
  -> Claude calls get_design_system for context
  -> Claude generates on-brand TSX
  -> Claude calls preview -> renders at localhost:4321
  -> Developer reviews, requests changes
  -> Claude calls push_to_figma -> editable frame in Figma
  -> Designer tweaks in Figma
  -> Developer asks Claude to read Figma changes (via Figma MCP)
  -> Claude updates the code to match`}
          language="text"
        />
        <Callout type="tip">
          The <code className="text-xs bg-emerald-50 rounded px-1 py-0.5">push_to_figma</code> tool requires the Figma MCP server to also be
          configured in your agent. See the{" "}
          <a
            href="https://www.figma.com/developers/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            Figma MCP docs
          </a>{" "}
          for setup instructions.
        </Callout>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Integration Guides</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Set up agent-specific integrations using the exported files:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link
              href="/docs/integrations/claude-code"
              className="text-indigo-600 hover:underline"
            >
              Claude Code
            </Link>{" "}
            — add to CLAUDE.md for persistent context on every prompt
          </li>
          <li>
            <Link
              href="/docs/integrations/cursor"
              className="text-indigo-600 hover:underline"
            >
              Cursor
            </Link>{" "}
            — .cursorrules or MDC rules for Composer and Chat
          </li>
          <li>
            <Link
              href="/docs/integrations/copilot"
              className="text-indigo-600 hover:underline"
            >
              GitHub Copilot
            </Link>{" "}
            — copilot-instructions.md setup
          </li>
          <li>
            <Link
              href="/docs/integrations/windsurf"
              className="text-indigo-600 hover:underline"
            >
              Windsurf
            </Link>{" "}
            — .windsurfrules and tokens.css import
          </li>
          <li>
            <Link
              href="/docs/integrations/codex"
              className="text-indigo-600 hover:underline"
            >
              OpenAI Codex
            </Link>{" "}
            — AGENTS.md placement and subdirectory overrides
          </li>
        </ul>
      </section>

      {/* Prev / Next */}
      <nav className="flex items-center justify-between border-t border-gray-200 pt-8">
        <div>
          {prev && (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
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
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
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
