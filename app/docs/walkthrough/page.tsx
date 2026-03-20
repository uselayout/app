import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Walkthrough | Layout Docs",
  description:
    "A complete end-to-end walkthrough of Layout, from extracting a design system to exporting a working AI kit and closing the Figma loop.",
};

export default function WalkthroughPage() {
  const { prev, next } = getAdjacentPages("/docs/walkthrough");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          End-to-End Walkthrough
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          This walkthrough covers the complete Layout workflow,
          from pasting a URL to having your AI agent automatically generate
          on-brand UI. Each step builds on the previous one, so read it in
          order the first time through.
        </p>
      </div>

      {/* Step 1: Extract from Figma */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          1. Extract from Figma
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Paste a Figma file URL (e.g.{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            https://www.figma.com/file/AbCdEf/My-Design-System
          </code>
          ) on the Studio home screen and enter your Figma Personal Access
          Token. You can create one at{" "}
          <strong>Figma → Settings → Account → Personal access tokens</strong>.
          The token is stored only in your browser and is never sent to
          Layout servers.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout calls the Figma REST API in two passes: first to list
          styles and component metadata, then to resolve actual values for each
          node. The following data is extracted:
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
                [
                  "Colour styles",
                  "Actual fill values resolved via node API, not just metadata",
                ],
                [
                  "Typography styles",
                  "Font family, size, weight, line-height, and letter-spacing as composites",
                ],
                [
                  "Effect styles",
                  "Drop shadows, inner shadows, and blur values",
                ],
                [
                  "Component inventory",
                  "Name, description, variant count, and property definitions for every component",
                ],
                [
                  "Variables",
                  "Enterprise plans only. The Variables API returns 403 on free/professional plans, which is treated as non-fatal and skipped automatically",
                ],
              ].map(([what, detail]) => (
                <tr key={what} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap align-top pt-3.5">
                    {what}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          The Figma Variables API returns 403 on non-Enterprise plans. This is
          expected. Layout treats it as non-fatal and continues extraction
          using colour and typography styles instead. You will still get a
          complete layout.md.
        </Callout>
      </section>

      {/* Step 2: Extract from a Website */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          2. Extract from a Website
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          No Figma file? Paste any live website URL instead. Layout uses
          Playwright to load the page in a headless browser and extract design
          data directly from the rendered DOM and computed styles. This works
          on any public website, whether it is your own staging environment, a competitor
          site, or a design reference you admire.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          The following is extracted from the live page:
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
                [
                  "CSS custom properties",
                  "Every --variable declaration found on the page",
                ],
                [
                  "Font declarations",
                  "@font-face rules and computed font families in use",
                ],
                [
                  "Computed styles",
                  "Colours, typography, spacing, borders, shadows, and transitions sampled from DOM elements",
                ],
                [
                  "Animations",
                  "@keyframes rules defined in the page stylesheets",
                ],
                [
                  "Library detection",
                  "Identifies Tailwind CSS, Bootstrap, and other CSS frameworks",
                ],
                [
                  "Screenshots",
                  "Full-page and viewport captures for visual reference",
                ],
              ].map(([what, detail]) => (
                <tr key={what} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap align-top pt-3.5">
                    {what}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          Website extraction uses Playwright and cannot run on Vercel
          serverless. Self-hosted deployments on Coolify, Hetzner, or Railway
          work without any extra configuration.
        </Callout>
      </section>

      {/* Step 3: Generate layout.md */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          3. Generate layout.md
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Once extraction completes, click{" "}
          <strong>Generate layout.md</strong> in the Studio. Claude Sonnet
          analyses the raw extracted data and synthesises a structured,
          LLM-optimised context file. Generation typically finishes in under 2
          minutes and streams into the editor in real time.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          The output follows a fixed 9-section structure with 2 appendices:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Section
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Contents
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Quick Reference",
                  "One-page cheat sheet with the most important tokens and rules at a glance",
                ],
                [
                  "1. Colour System",
                  "All colour tokens with hex values and usage guidance",
                ],
                [
                  "2. Typography",
                  "Type scale, font families, weights, and line-heights",
                ],
                [
                  "3. Spacing & Layout",
                  "Spacing scale and grid conventions",
                ],
                [
                  "4. Component Specs",
                  "Per-component usage rules, variants, and TSX code examples",
                ],
                [
                  "5. Elevation & Depth",
                  "Shadow tokens and z-index scale",
                ],
                [
                  "6. Motion & Animation",
                  "Duration values, easing curves, and animation patterns",
                ],
                [
                  "7. Border & Radius",
                  "Border widths, styles, and border-radius scale",
                ],
                [
                  "8. Anti-Patterns",
                  "Explicit list of what the AI must not do, including hardcoded colours, wrong tokens, and off-brand patterns",
                ],
                [
                  "9. Icons & Assets",
                  "Icon library in use and asset conventions",
                ],
                [
                  "Appendix A",
                  "Raw CSS custom properties from the extraction",
                ],
                [
                  "Appendix B",
                  "Raw typography declarations",
                ],
              ].map(([section, contents]) => (
                <tr key={section} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap align-top pt-3.5">
                    {section}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{contents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="tip">
          The Quick Reference section is the highest-value part of layout.md.
          It is placed at the top because most AI agents read context
          top-to-bottom and may truncate long files. If you manually edit
          layout.md, prioritise keeping the Quick Reference accurate.
        </Callout>
      </section>

      {/* Step 4: The Studio */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          4. The Studio
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          After generation completes, the Studio opens with two modes: Editor
          mode and Canvas mode. All changes auto-save to browser storage with
          a 2-second debounce. There is no Save button and no account required.
        </p>
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Source Panel{" "}
              <span className="text-gray-400 font-normal text-sm">(left)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Displays the raw extracted data: colour tokens, typography
              styles, spacing values, component inventory, and screenshots. Use
              this to verify what was captured before or after generation. If
              something is missing or misidentified, you can re-extract without
              losing any edits made in the editor.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Editor Mode{" "}
              <span className="text-gray-400 font-normal text-sm">
                (Source Panel + Monaco Editor)
              </span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              A Monaco-based markdown editor, the same editor used in VS Code.
              This is where you refine layout.md: fix misidentified tokens,
              strengthen the anti-patterns section, rewrite component specs, or
              add brand guidance that extraction cannot infer. Section
              navigation pills let you jump between the 9 sections quickly. An
              AI edit bar below the editor lets you make targeted changes using
              natural language prompts.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Canvas Mode{" "}
              <span className="text-gray-400 font-normal text-sm">
                (Source Panel + Explorer Canvas)
              </span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              The Explorer Canvas is the AI generation surface. Generate
              multiple component variants simultaneously, compare output with
              and without layout.md in a side-by-side comparison view, check
              the per-variant health score, and iterate until the AI reliably
              produces on-brand output. You can also push variants to Figma
              directly from the canvas.
            </p>
          </div>
        </div>
      </section>

      {/* Step 5: Test Your Context */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          5. Test Your Context
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Explorer Canvas is the most important step before exporting. It
          tells you whether layout.md actually improves AI output, and by how
          much.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Comparison View
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            The comparison view generates variants side by side, with and
            without layout.md context. Run a prompt and compare the two results
            directly. A well-written context file produces noticeably better
            output: correct token usage, proper spacing, on-brand typography,
            and no hardcoded colours. This A/B comparison is the clearest signal
            that your layout.md is working.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Quick Prompts
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Preset component requests appear as one-click buttons in the
            Explorer Canvas: primary button, card, form input, badge, and more.
            If your extraction included Figma components, the canvas also
            generates dynamic prompts for each extracted component name, giving
            you targeted tests for your specific design system rather than
            generic UI patterns.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Health Score
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Each generated variant in the Explorer Canvas shows a 0-100 health
            score measuring token faithfulness, component accuracy, and
            anti-pattern violations. The score reflects how closely the
            generated code follows the rules in layout.md. Aim for 80 or higher
            before exporting.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Live Variant Preview
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Each variant card in the Explorer Canvas renders the generated TSX
            live in a sandboxed iframe with React and Tailwind CSS loaded. You
            see the actual component, not just code, so visual errors such as
            wrong colours or broken layouts are immediately obvious without
            leaving the Studio.
          </p>
        </div>

        <Callout type="tip">
          If the health score is consistently below 60, check that the Colour
          System and Typography sections of layout.md contain well-formed CSS
          code blocks. The AI needs concrete, parseable examples to reference
          at generation time. Prose descriptions alone are not enough.
        </Callout>
      </section>

      {/* Step 6: Export Your AI Kit */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          6. Export Your AI Kit
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Click <strong>Export</strong> in the top bar to open the export
          modal. layout.md is always included. The ZIP bundle can contain up
          to 8 additional files, each optimised for a different AI tool or
          framework:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  File
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Optimised For
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "layout.md",
                  "All AI agents. The primary context file",
                ],
                [
                  "CLAUDE.md",
                  "Claude Code. Persistent project context injected on every prompt",
                ],
                [
                  "AGENTS.md",
                  "Codex, Jules, Factory, Amp. Agents following the agents.md convention",
                ],
                [
                  ".cursorrules",
                  "Cursor. Legacy rules format applied across all Composer and Chat sessions",
                ],
                [
                  "copilot-instructions.md",
                  "GitHub Copilot. Workspace instructions file read by Copilot Chat",
                ],
                [
                  ".windsurfrules",
                  "Windsurf. Global rules applied to all Cascade sessions in the project",
                ],
                [
                  "tokens.css",
                  "Any stylesheet. CSS custom properties ready to import directly",
                ],
                [
                  "tokens.json",
                  "Style Dictionary, Theo, and W3C DTCG-compatible tooling",
                ],
                [
                  "tailwind.config.js",
                  "Tailwind CSS. Theme extension with extracted colours, spacing, and radii",
                ],
              ].map(([file, use]) => (
                <tr key={file} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap align-top pt-3.5">
                    {file}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="info">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            tailwind.config.js
          </code>{" "}
          uses{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            theme.extend
          </code>{" "}
          so it merges with your existing config without overwriting defaults.{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            tokens.css
          </code>{" "}
          can be imported at the top of your global stylesheet with no
          modifications required.
        </Callout>
      </section>

      {/* Step 7: Set Up the CLI */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          7. Set Up the CLI
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            @layoutdesign/context
          </code>{" "}
          CLI imports your Studio export and configures the MCP server so your
          AI agent automatically reads the design system on every session. Two
          commands are all that is needed:
        </p>
        <CopyBlock
          code={`npx @layoutdesign/context import ./layout-export.zip
npx @layoutdesign/context install`}
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            import
          </code>{" "}
          command unpacks the ZIP into a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            .layout/
          </code>{" "}
          directory in your project. The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            install
          </code>{" "}
          command detects Claude Code, Cursor, and Windsurf and writes the MCP
          server configuration to whichever are present. No manual JSON
          editing required.
        </p>
        <Callout type="tip">
          After running{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            install
          </code>
          , restart your AI agent once so it picks up the new MCP server
          configuration. From that point on, every session in the project
          directory has automatic access to the design system tools.
        </Callout>
      </section>

      {/* Step 8: MCP Tools Reference */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          8. MCP Tools Reference
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Once the MCP server is configured, your AI agent can call 10 tools
          automatically when building UI. You do not need to invoke them
          manually. The agent decides when to use them based on the task.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Tool
                </th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  What It Does
                </th>
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
                  "Returns CSS, JSON, or Tailwind tokens filtered by type (colour, spacing, etc.)",
                ],
                [
                  "get_component",
                  "Returns the spec and TSX code example for a named component",
                ],
                [
                  "list_components",
                  "Returns the full inventory of components in the design system",
                ],
                [
                  "check_compliance",
                  "Validates a code snippet against design rules and returns violations",
                ],
                [
                  "preview",
                  "Renders a component in a local browser canvas at localhost:4321",
                ],
                [
                  "push_to_figma",
                  "Sends a rendered component to Figma as editable frames via the Figma MCP",
                ],
                [
                  "url_to_figma",
                  "Captures a public URL as editable Figma frames with auto-layout via Figma MCP and Playwright",
                ],
                [
                  "design_in_figma",
                  "Designs UI directly in Figma using extracted tokens from a natural language prompt",
                ],
                [
                  "update_tokens",
                  "Updates or adds design tokens in the loaded kit in CSS, JSON, or Tailwind format",
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

      {/* Step 9: The Figma Closed Loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          9. The Figma Workflow
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout bridges the gap between code and design. Preview
          components locally at{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            localhost:4321
          </code>
          , push them to Figma for designer review, and design directly in Figma
          using the extracted tokens. A typical workflow looks like this:
        </p>
        <CopyBlock
          code={`Developer prompts Claude
  -> Claude calls get_design_system for context
  -> Claude generates on-brand TSX
  -> Claude calls preview -> renders at localhost:4321
  -> Developer reviews, requests changes
  -> Claude calls push_to_figma -> frames placed in Figma
  -> Designer reviews and refines using the same tokens
  -> Developer uses Figma MCP to read designer feedback`}
          language="text"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Each step uses the same design tokens extracted from the
          source. The AI generates code with the tokens, the preview renders
          using Tailwind, and the Figma frames reference the same values,
          keeping code and design aligned.
        </p>
        <Callout type="info">
          The{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            push_to_figma
          </code>{" "}
          and{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            design_in_figma
          </code>{" "}
          tools require the Figma MCP server to be configured in your AI agent
          separately. See the{" "}
          <a
            href="https://www.figma.com/developers/mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            Figma MCP documentation
          </a>{" "}
          for setup instructions.
        </Callout>
      </section>

      {/* Step 10: Tips & Troubleshooting */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          10. Tips &amp; Troubleshooting
        </h2>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Health Score Ranges
          </h3>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                    Score
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                    What It Means
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  [
                    "80-100",
                    "Excellent. layout.md is providing strong, reliable context. Safe to export and ship.",
                  ],
                  [
                    "60-79",
                    "Good. Context is working but some tokens or anti-patterns may be ignored. Review the weakest sections before exporting.",
                  ],
                  [
                    "Below 60",
                    "Needs work. The AI is not reliably following your design system. Check that CSS code blocks are well-formed and the anti-patterns section is explicit.",
                  ],
                ].map(([score, meaning]) => (
                  <tr key={score} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap align-top pt-3.5">
                      {score}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{meaning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Re-Extracting After a Design Update
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            When the design system changes (new brand colours, updated type
            scale, redesigned components), paste the URL again on the home
            screen and re-extract. The Studio loads the updated data into the
            Source panel. You can then re-generate layout.md or manually update
            only the changed sections in the editor.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Comparison View A/B Testing
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            The comparison view in the Explorer Canvas is the fastest way to
            validate whether layout.md is providing value. Generate variants
            with and without context side by side using the same prompt. If the
            output looks identical, the context file is not doing its job and
            needs strengthening. Focus on the Quick Reference section and the
            anti-patterns list first.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            Free Starter Kits
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            If you want to try the CLI without extracting a design system first,
            three free starter kits are bundled with the package. Each was
            extracted from a live website using Playwright and includes a Quick
            Reference, core tokens, and 5 component specs, enough to get
            meaningful on-brand output immediately.
          </p>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                    Kit
                  </th>
                  <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                    Aesthetic
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ["linear-lite", "Developer tool, dark-first, minimal"],
                  ["stripe-lite", "Clean, trust-focused, enterprise"],
                  ["notion-lite", "Document-first, typography-heavy, neutral"],
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
            code={`npx @layoutdesign/context init --kit linear-lite
npx @layoutdesign/context init --kit stripe-lite
npx @layoutdesign/context init --kit notion-lite`}
            language="bash"
          />
          <Callout type="tip">
            Starter kits are a good way to test your AI agent integration end to
            end before committing to a full extraction. Import a kit, run{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              install
            </code>
            , and verify the MCP tools are working before bringing in your own
            design system.
          </Callout>
        </div>
      </section>

      {/* Next Steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next Steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link
              href="/docs/studio"
              className="text-gray-900 hover:underline"
            >
              Studio Guide
            </Link>
            . Deeper reference for the editor, canvas, and all extraction
            options.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI Guide
            </Link>
            . Full CLI command reference including kit management and
            auto-configure options.
          </li>
          <li>
            <Link
              href="/docs/layout-md"
              className="text-gray-900 hover:underline"
            >
              layout.md Spec
            </Link>
            . The formal specification for each section of the context file.
          </li>
          <li>
            <Link
              href="/docs/integrations/claude-code"
              className="text-gray-900 hover:underline"
            >
              Claude Code Integration
            </Link>
            . Add the export files to your project for persistent on-brand
            context.
          </li>
          <li>
            <Link
              href="/docs/integrations/cursor"
              className="text-gray-900 hover:underline"
            >
              Cursor Integration
            </Link>
            . Set up MDC rules files for Cursor 0.43+.
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
