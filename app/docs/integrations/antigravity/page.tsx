import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "Google Antigravity | Layout Docs",
  description:
    "Use Layout with Google Antigravity via the MCP Store or manual configuration.",
};

const mcpConfigSnippet = `{
  "mcpServers": {
    "layout": {
      "command": "npx",
      "args": ["-y", "@layoutdesign/context", "serve"]
    }
  }
}`;

const installSnippet = `npx @layoutdesign/context install`;

export default function AntigravityPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/antigravity");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Google Antigravity
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Google Antigravity is an AI-first IDE built on VS Code with native MCP
          support. Layout connects via an MCP server so Antigravity agents get
          your full design system context on every prompt.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Option A: Auto-install (recommended)
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Run the install command in your project directory. It detects
                Antigravity and writes the MCP configuration automatically:
              </p>
              <CopyBlock code={installSnippet} language="bash" />
              <p className="text-base text-gray-600 leading-relaxed">
                Restart Antigravity once so it picks up the new MCP server. From
                that point on, every session in the project has automatic access
                to your design system tools.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Option B: MCP Store
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Open the MCP Store in Antigravity, search for{" "}
                <strong>Layout</strong>, and click Install. This adds the MCP
                server configuration without touching the terminal.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Option C: Manual configuration
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Add the following to your project&apos;s MCP settings file (
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  .antigravity/mcp.json
                </code>{" "}
                or via Settings &gt; MCP Servers):
              </p>
              <CopyBlock code={mcpConfigSnippet} language="json" />
            </div>
          </div>
        </div>

        <Callout type="tip">
          Since Antigravity is a VS Code fork, its MCP configuration follows the
          same pattern as Cursor and Windsurf. If you already have Layout
          configured in another VS Code-based editor, the same setup applies.
        </Callout>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">What you get</h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Once connected, Antigravity agents have access to all Layout MCP
            tools:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-gray-600">
            <li>
              <strong>get_design_system</strong> — full layout.md content, or a specific section
            </li>
            <li>
              <strong>get_tokens</strong> — CSS, JSON, or Tailwind tokens by category
            </li>
            <li>
              <strong>get_component</strong> — component code and spec by name
            </li>
            <li>
              <strong>list_components</strong> — all components with metadata
            </li>
            <li>
              <strong>check_compliance</strong> — validate code against design system rules
            </li>
            <li>
              <strong>preview</strong> — live component preview at localhost:4321
            </li>
            <li>
              <strong>push_to_figma</strong> — export to Figma as auto-layout frames
            </li>
            <li>
              <strong>url_to_figma</strong> — capture a live URL into Figma
            </li>
            <li>
              <strong>design_in_figma</strong> — design UI in Figma using your tokens
            </li>
            <li>
              <strong>update_tokens</strong> — add or update tokens in the loaded kit
            </li>
            <li>
              <strong>get_screenshots</strong> — extraction screenshots for visual reference
            </li>
            <li>
              <strong>push_tokens_to_figma</strong> — push tokens to Figma as native variables and styles
            </li>
            <li>
              <strong>check_setup</strong> — diagnose and fix MCP setup issues
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Manager view tip
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            Antigravity&apos;s Manager view lets you orchestrate multiple agents
            working in parallel. Each agent session inherits the MCP server
            configuration, so all parallel workspaces share the same design
            system context automatically.
          </p>
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
              &larr; {prev.title}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link
              href={next.href}
              className="text-gray-900 hover:underline text-sm"
            >
              {next.title} &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
