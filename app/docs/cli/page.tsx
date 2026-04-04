import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "CLI Guide | Layout Docs",
  description:
    "Install the @layoutdesign/context MCP server, import your Studio export, and give your AI agent automatic access to your design system.",
};

export default function CliPage() {
  const { prev, next } = getAdjacentPages("/docs/cli");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Layout CLI</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            @layoutdesign/context
          </code>{" "}
          is an open-source, MIT-licensed npm package that serves your design
          system context to AI agents via the Model Context Protocol (MCP). Once
          configured, your AI agent calls{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            get_design_system
          </code>{" "}
          automatically whenever it builds UI. No manual context pasting
          required.
        </p>
      </div>

      {/* Prerequisites */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Prerequisites</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong className="font-semibold text-[#0a0a0a]">Node.js 18 or later</strong>. Run{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">node --version</code> to check.
            Download from{" "}
            <a href="https://nodejs.org" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">nodejs.org</a>.
          </li>
          <li>
            <strong className="font-semibold text-[#0a0a0a]">npm 7+ or npx</strong>, included with Node.js.
            Run <code className="text-xs bg-gray-100 rounded px-1 py-0.5">npm --version</code> to confirm.
          </li>
        </ul>
      </section>

      {/* Installation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Installation</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Initialise a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .layout/
          </code>{" "}
          directory in your project with a free starter kit. No signup required.
        </p>
        <CopyBlock
          code="npx @layoutdesign/context init --kit linear-lite"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This creates a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .layout/
          </code>{" "}
          directory containing layout.md and the token files for the chosen
          starter kit. See the{" "}
          <a href="#starter-kits" className="text-gray-900 hover:underline">
            Free Starter Kits
          </a>{" "}
          section below for all available kit names.
        </p>
        <Callout type="tip">
          After <code className="text-xs bg-gray-100 rounded px-1 py-0.5">init</code>, run{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">npx @layoutdesign/context install</code> to
          auto-configure your AI agent&apos;s MCP settings. No manual JSON editing required.
        </Callout>
      </section>

      {/* Importing from Studio */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Importing from Studio</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          If you have already exported a ZIP bundle from Layout,
          import it directly. No need to use a starter kit.
        </p>
        <CopyBlock
          code="npx @layoutdesign/context import ./export.zip"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This unpacks the bundle into{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .layout/
          </code>{" "}
          and makes your extracted layout.md and tokens available to the MCP
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
          code="npx @layoutdesign/context serve"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The server runs on stdio and responds to MCP tool calls from your
          configured AI agent. No port is opened. Communication is via
          standard input/output, the MCP convention for local tools.
        </p>
        <Callout type="info">
          Add the MCP server to your agent config once. After that, every
          session in that project directory automatically has access to the
          design system tools. No flags, no manual context injection.
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
          code="npx @layoutdesign/context install"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          This detects Claude Code, Cursor, Windsurf, Copilot, Codex, and Gemini CLI and configures whichever are present. To target a specific tool:
        </p>
        <CopyBlock
          code={`npx @layoutdesign/context install --target claude
npx @layoutdesign/context install --target cursor
npx @layoutdesign/context install --target windsurf
npx @layoutdesign/context install --target vscode
npx @layoutdesign/context install --target codex
npx @layoutdesign/context install --target gemini`}
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
          code="npx @layoutdesign/context list"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Switch to a different kit:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context use stripe-lite"
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
          code={`npx @layoutdesign/context import ./layout-export.zip
npx @layoutdesign/context install
# Done -  your AI agent reads the design system automatically`}
          language="bash"
        />
      </section>

      {/* MCP Tools */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Available MCP Tools</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The MCP server exposes 13 tools your AI agent can call automatically:
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
                  "Returns the full layout.md, or a specific section by number",
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
                  "Renders a component and pushes frames to Figma. Supports capture mode (screenshot-based, default) and native mode (editable auto-layout objects via Figma MCP, no Playwright needed)",
                ],
                [
                  "push_tokens_to_figma",
                  "Pushes design system tokens to Figma as native variables and styles (via Figma MCP). Optionally specify a file key, or omit to create a new file",
                ],
                [
                  "url_to_figma",
                  "Captures a public URL at multiple viewports and places the frames in Figma (via Figma MCP + Playwright)",
                ],
                [
                  "design_in_figma",
                  "Designs UI directly in Figma using your extracted tokens, from a natural language prompt",
                ],
                [
                  "update_tokens",
                  "Updates or adds design tokens in the loaded kit (CSS, JSON, or Tailwind format)",
                ],
                [
                  "get_screenshots",
                  "Returns reference screenshots captured during website extraction for visual comparison",
                ],
                [
                  "check_setup",
                  "Diagnoses and optionally fixes MCP server setup issues (registration, OAuth, reachability)",
                ],
              ].map(([tool, desc]) => (
                <tr key={tool} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap align-top pt-3.5">
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
          core tokens, and 5 component specs. That is enough to get meaningful on-brand
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
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
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
npx @layoutdesign/context init --kit stripe-lite
npx @layoutdesign/context init --kit notion-lite`}
          language="bash"
        />
      </section>

      {/* Doctor */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Checking Your Setup</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">doctor</code>{" "}
          command inspects your environment and reports any configuration issues:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context doctor"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          It checks: Node.js version, Claude Code installation, Figma MCP configuration, and Playwright MCP availability.
          To automatically install any missing dependencies:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context doctor --fix"
          language="bash"
        />
        <Callout type="tip">
          Run <code className="text-xs bg-gray-100 rounded px-1 py-0.5">doctor</code> first if{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">push_to_figma</code> or{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">url_to_figma</code> are not working.
          Those tools require the Figma MCP and Playwright MCP to be configured separately.
        </Callout>
      </section>

      {/* Serve Local */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Serving a Local Directory</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">serve-local</code>{" "}
          command serves a local directory over HTTP so the{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">url_to_figma</code>{" "}
          MCP tool can capture locally-built components as Figma frames:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context serve-local ./my-components"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The directory is served at{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">http://localhost:4322</code>.
          You can then pass that URL to the{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">url_to_figma</code> tool.
        </p>
        <Callout type="info">
          Requires Python 3 to be installed on your system.
          Check with <code className="text-xs bg-gray-100 rounded px-1 py-0.5">python3 --version</code>.
          Python 3 is pre-installed on macOS and most Linux distributions.
        </Callout>
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
          tools close the full loop between code and design, something no other
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
          The <code className="text-xs bg-gray-100 rounded px-1 py-0.5">push_to_figma</code> tool requires the Figma MCP server to also be
          configured in your agent. See the{" "}
          <a
            href="https://www.figma.com/developers/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            Figma MCP docs
          </a>{" "}
          for setup instructions.
        </Callout>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Troubleshooting</h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              problem: "Port 4321 already in use",
              fix: (
                <>
                  Another process is using the preview port. Kill it and retry:{" "}
                  <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                    lsof -ti:4321 | xargs kill
                  </code>
                </>
              ),
            },
            {
              problem: "Figma MCP not authenticated",
              fix: (
                <>
                  Run{" "}
                  <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                    claude mcp run figma
                  </code>{" "}
                  once in your terminal to complete the OAuth flow, then try again.
                </>
              ),
            },
            {
              problem: "MCP tools not showing in Claude Code",
              fix: (
                <>
                  Run{" "}
                  <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                    npx @layoutdesign/context install
                  </code>{" "}
                  again to re-register the MCP server, then fully restart Claude Code (not just reload the window).
                </>
              ),
            },
            {
              problem: "ZIP import fails",
              fix: "Ensure the file ends in .zip and was downloaded directly from Layout Studio. Browser-zipped or re-archived files may have a different structure. Try re-downloading from Studio.",
            },
          ].map(({ problem, fix }) => (
            <div key={problem} className="px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-[#0a0a0a]">{problem}</p>
              <p className="text-sm text-gray-600">{fix}</p>
            </div>
          ))}
        </div>
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
              className="text-gray-900 hover:underline"
            >
              Claude Code
            </Link>
            : add to CLAUDE.md for persistent context on every prompt
          </li>
          <li>
            <Link
              href="/docs/integrations/cursor"
              className="text-gray-900 hover:underline"
            >
              Cursor
            </Link>
            : .cursorrules or MDC rules for Composer and Chat
          </li>
          <li>
            <Link
              href="/docs/integrations/copilot"
              className="text-gray-900 hover:underline"
            >
              GitHub Copilot
            </Link>
            : copilot-instructions.md setup
          </li>
          <li>
            <Link
              href="/docs/integrations/windsurf"
              className="text-gray-900 hover:underline"
            >
              Windsurf
            </Link>
            : .windsurfrules and tokens.css import
          </li>
          <li>
            <Link
              href="/docs/integrations/antigravity"
              className="text-gray-900 hover:underline"
            >
              Google Antigravity
            </Link>
            : MCP server via MCP Store or manual config
          </li>
          <li>
            <Link
              href="/docs/integrations/codex"
              className="text-gray-900 hover:underline"
            >
              OpenAI Codex
            </Link>
            : AGENTS.md placement and subdirectory overrides
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
