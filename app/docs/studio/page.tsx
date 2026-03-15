import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Studio Guide -  Layout Docs",
  description:
    "How to use the Studio — Layout's three-panel editor for extraction, DESIGN.md generation, testing, and exporting.",
};

export default function StudioPage() {
  const { prev, next } = getAdjacentPages("/docs/studio");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Studio</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Studio is Layout&apos;s browser-based tool for extracting design
          systems, synthesising LLM-optimised context files, and testing them
          against real AI output -  all in one place. Paste a URL, get a complete
          AI kit in under 2 minutes.
        </p>
      </div>

      {/* Extraction */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Extraction</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout can extract design tokens from two sources: a Figma file or
          any live website. Paste the URL on the home screen and click{" "}
          <strong>Extract</strong>. Extraction typically completes in under 2
          minutes.
        </p>

        <div className="space-y-6">
          {/* From Figma */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">From Figma</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Paste a Figma file URL (e.g.{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                https://www.figma.com/file/...
              </code>
              ) and provide your Figma personal access token. The Studio calls
              the Figma REST API to resolve actual token values -  not just
              metadata.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                      What Gets Extracted
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["Colour styles", "Fill values resolved via node API, not just metadata"],
                    ["Typography styles", "Font family, size, weight, line-height, letter-spacing as composites"],
                    ["Effect styles", "Shadows, blur"],
                    ["Component inventory", "Name, description, variant count, property definitions"],
                    ["Variables", "Enterprise plans only -  gracefully skipped otherwise"],
                  ].map(([what, detail]) => (
                    <tr key={what} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                        {what}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* From Websites */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">From Websites</h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Paste any live website URL. Playwright loads the page in a
              headless browser and extracts design data from the rendered DOM and
              computed styles -  no Figma access required.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                      What Gets Extracted
                    </th>
                    <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    ["CSS custom properties", "All --var declarations from the page"],
                    ["Font declarations", "@font-face rules and computed fonts"],
                    ["Computed styles", "Colours, typography, spacing, borders, shadows, transitions from DOM elements"],
                    ["Animations", "@keyframes rules"],
                    ["Library detection", "Tailwind CSS, Bootstrap, etc."],
                    ["Screenshots", "Full-page and viewport captures"],
                  ].map(([what, detail]) => (
                    <tr key={what} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                        {what}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Callout type="info">
          Website extraction requires Playwright and cannot run on Vercel
          serverless. Self-hosted deployments (Coolify, Hetzner, Railway) work
          fine.
        </Callout>
      </section>

      {/* Three-Panel Editor */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The Three-Panel Editor</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          After extraction completes, the Studio opens a three-panel workspace.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Source Panel <span className="text-gray-400 font-normal text-sm">(left)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Shows the raw extracted data -  colour tokens, typography styles,
              spacing values, component inventory, and screenshots. Use this to
              verify what was extracted before generating DESIGN.md. If
              something looks wrong, you can re-extract with different options.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Editor Panel <span className="text-gray-400 font-normal text-sm">(centre)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              A Monaco-based markdown editor for DESIGN.md. Once you generate
              the context file, edit it here to fix misidentified tokens,
              strengthen the anti-patterns section, or rewrite component specs.
              Auto-saves with a 2-second debounce. Section navigation pills let
              you jump between the 9 sections of DESIGN.md quickly.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Test Panel <span className="text-gray-400 font-normal text-sm">(right)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Ask Claude to generate components using your design system. Renders
              live TSX output in a sandboxed iframe with React and Tailwind. Use
              the health score to measure context adherence and the context
              toggle to compare output with and without DESIGN.md.
            </p>
          </div>
        </div>
      </section>

      {/* Testing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Testing Your Design System</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Test panel is the most important step before exporting. It lets
          you verify that DESIGN.md actually improves AI output.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Context Toggle</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Toggle <strong>DESIGN.md context: OFF</strong> to see what Claude
            generates with no design system context. Then toggle it back{" "}
            <strong>ON</strong> and run the same prompt. The visual difference
            shows you exactly what value DESIGN.md is providing. A good context
            file produces noticeably better output -  correct token usage, proper
            spacing, on-brand typography.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Health Score</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            After each test generation, the panel shows a 0–100 health score
            measuring token faithfulness, component accuracy, and anti-pattern
            violations. Aim for 80+ before exporting.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Quick Prompts</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Preset component requests appear as buttons (primary button, card,
            form input, etc.). If your extraction included Figma components, the
            panel also generates dynamic prompts for each extracted component
            name -  giving you targeted tests for your specific design system.
          </p>
        </div>

        <Callout type="tip">
          If the health score is below 50, check that DESIGN.md has well-formed
          CSS code blocks in the token sections. The AI needs parseable examples
          to reference at generation time.
        </Callout>
      </section>

      {/* Quality Score */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Quality Score</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Quality tab in the Source Panel shows your DESIGN.md completeness
          score across 6 weighted categories:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Category</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Quick Reference", "15%"],
                ["Colours", "20%"],
                ["Typography", "15%"],
                ["Spacing", "10%"],
                ["Components", "25%"],
                ["Anti-patterns", "15%"],
              ].map(([category, weight]) => (
                <tr key={category} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a]">{category}</td>
                  <td className="px-4 py-3 text-gray-600">{weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3">
          {[
            { range: "90 - 100", label: "Production-ready", desc: "Comprehensive coverage across all sections." },
            { range: "70 - 89", label: "Good", desc: "Covers most areas, minor gaps in documentation." },
            { range: "40 - 69", label: "Needs work", desc: "Missing key sections or lacking detail." },
            { range: "0 - 39", label: "Incomplete", desc: "Significant gaps that will affect AI output quality." },
          ].map(({ range, label, desc }) => (
            <div
              key={range}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-gray-100 text-gray-800 px-4 py-3"
            >
              <span className="shrink-0 font-mono text-sm font-bold pt-0.5">{range}</span>
              <div className="text-sm">
                <span className="font-semibold">{label}</span> - {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Re-extraction and Diffing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Re-extraction and Diffing</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When you re-extract a design system (via the re-extract button in the
          top bar), Layout compares the new extraction against the previous one
          and shows a visual diff:
        </p>
        <ol className="space-y-3 text-base text-gray-600 leading-relaxed list-none pl-0">
          {[
            "Layout captures the previous extraction state",
            "Runs a fresh extraction from the source",
            "Shows a diff modal highlighting all changes (added, removed, modified tokens/components/fonts)",
            'Choose "Accept" to keep the new extraction or "Discard" to revert to the previous state',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-4">
              <span className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white text-sm font-bold">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <Callout type="tip">
          Re-extract periodically after major design updates. The diff view
          makes it easy to see exactly what changed without manually comparing
          token lists.
        </Callout>
      </section>

      {/* Exporting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Exporting</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Click <strong>Export</strong> in the top bar to open the export modal.
          DESIGN.md is always included. Choose which additional formats to
          include in the ZIP:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Format</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Filename</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Use It For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["CLAUDE.md", "CLAUDE.md-section.md", "Persistent context in Claude Code projects"],
                ["AGENTS.md", "AGENTS.md", "Codex, Jules, Factory, Amp -  any agent following agents.md spec"],
                ["Cursor Rules", ".cursor/rules/design-system.mdc", "Auto-applied rules in Cursor 0.43+"],
                ["CSS Tokens", "tokens.css", "Import directly into any stylesheet"],
                ["JSON Tokens", "tokens.json", "W3C DTCG format for Style Dictionary, Theo, etc."],
                ["Tailwind Config", "tailwind.config.js", "Theme extension with extracted colours, spacing, radii"],
              ].map(([format, file, use]) => (
                <tr key={format} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">
                    {format}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {file}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout type="info">
          The Tailwind config and tokens.css are ready to drop into your project
          as-is -  no manual editing required. The Tailwind config uses{" "}
          <code className="text-xs bg-white rounded px-1 py-0.5 border border-gray-200">
            theme.extend
          </code>{" "}
          so it merges with your existing config.
        </Callout>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next Steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI Guide
            </Link>{" "}
 -  set up the MCP server to serve design context automatically to
            your AI agent.
          </li>
          <li>
            <Link
              href="/docs/integrations/claude-code"
              className="text-gray-900 hover:underline"
            >
              Claude Code integration
            </Link>{" "}
 -  add the export files to your project for persistent on-brand
            context.
          </li>
          <li>
            <Link
              href="/docs/integrations/cursor"
              className="text-gray-900 hover:underline"
            >
              Cursor integration
            </Link>{" "}
 -  set up .cursorrules or MDC rules files.
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
