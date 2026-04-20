import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Studio Guide | Layout Docs",
  description:
    "How to use the Studio: Layout's browser-based workspace for extraction, layout.md generation, AI exploration, and exporting.",
};

export default function StudioPage() {
  const { prev, next } = getAdjacentPages("/docs/studio");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Studio</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Studio is Layout&apos;s browser-based workspace for extracting
          design systems, synthesising LLM-optimised context files, and
          exploring AI-generated components. Paste a URL, get a complete AI kit
          in under 2 minutes.
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
              the Figma REST API to resolve actual token values, not just
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
                    ["Colour styles", "Fill values resolved via node API, not just metadata. Includes gradients (linear, radial, conic with angle and all stops)"],
                    ["Typography styles", "Font family, size, weight, line-height, letter-spacing, textCase, textDecoration, lineHeightPercent as composites"],
                    ["Effect styles", "Shadows, blur effects (both filter and backdrop-filter)"],
                    ["Component inventory", "Name, description, variant count, property definitions with defaults and preferred values"],
                    ["Auto-layout patterns", "Stack direction, spacing, padding, alignment detected from component structures"],
                    ["Font declarations", "Family, weight, style. Google Fonts auto-detected in previews"],
                    ["Variables & modes", "Variable collections with light/dark mode support. Alias resolution with cycle detection. Enterprise plans only for direct variable access; gracefully skipped otherwise"],
                    ["Motion tokens", "Transition durations, timing functions, and easing values"],
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
              computed styles. No Figma access required.
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

        <Callout type="warning">
          If extraction reaches internal caps (e.g. very large design files with
          hundreds of styles), amber truncation warnings appear in the progress
          overlay showing exactly what was capped and at what count. The
          extraction still completes with the data it captured.
        </Callout>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Cancelling a run</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Long-running Figma or website extractions can be cancelled from the
            progress overlay. Click <strong>Cancel</strong> to stop mid-way
            rather than waiting for completion. Any partial data is discarded;
            the project returns to its previous state.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Starting from blank</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Extraction isn&apos;t mandatory. On the new-project screen, pick{" "}
            <strong>Start blank</strong> to open an empty kit with all standard
            sections. Add tokens, upload branding, attach context, then
            generate layout.md when you&apos;re ready. See the{" "}
            <Link href="/docs/design-system" className="text-gray-900 hover:underline">
              Design System hub
            </Link>{" "}
            for the curated token workflow.
          </p>
        </div>
      </section>

      {/* Studio Workspace */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The Studio Workspace</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          After extraction completes, the Studio opens a two-panel workspace
          with a mode toggle in the top bar. The Source Panel stays visible on
          the left in both modes. The right panel switches between the Editor
          and the Explorer.
        </p>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Source Panel <span className="text-gray-400 font-normal text-sm">(left)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Shows the raw extracted data: colour tokens, typography styles,
              spacing values, component inventory, screenshots, fonts, quality
              score, and saved components. Use this to verify what was extracted before
              generating layout.md. If something looks wrong, you can re-extract
              with different options.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              When your design system uses multiple modes (e.g. light and dark),
              the Source Panel shows mode filter pills at the top of the token
              list. Select a mode to see only tokens from that mode, or choose
              All to see everything. Individual tokens display a mode badge
              indicating which mode they belong to. Modes are preserved across
              all export formats (CSS, JSON, Tailwind).
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              If your codebase is connected via{" "}
              <Link href="/docs/cli" className="text-gray-900 underline">
                the CLI scanner
              </Link>
              , the Components tab shows a merged view of Figma components and
              codebase components side by side. Each component displays its
              source (Figma, Code, or both), import path, and Storybook story
              count if detected. Icons are automatically filtered from the list.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Editor Mode <span className="text-gray-400 font-normal text-sm">(right panel)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              A Monaco-based markdown editor for layout.md. Once you generate
              the context file, edit it here to fix misidentified tokens,
              strengthen the anti-patterns section, or rewrite component specs.
              Auto-saves with a 2-second debounce. Section navigation pills let
              you jump between the 9 sections of layout.md quickly.
            </p>
            <p className="text-base text-gray-600 leading-relaxed">
              An <strong>AI edit bar</strong> sits below the editor. Type
              natural-language instructions like{" "}
              <em>&quot;make buttons square instead of rounded&quot;</em> or{" "}
              <em>&quot;add a smaller button size variant&quot;</em> and Layout
              applies the changes directly to your layout.md. Edits are
              surgical: only the lines that actually need to change are
              rewritten, so untouched sections stay byte-identical and the
              full-file &ldquo;Writing... 100 lines&rdquo; rewrites are gone.
              An undo button appears after each edit so you can revert
              instantly if needed.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Design System hub
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              A dedicated page with Tokens, Assets, Context, and Editor
              sub-tabs. This is the primary surface for curating extracted
              tokens into canonical roles, uploading brand assets, and
              attaching product context. Full walkthrough in the{" "}
              <Link href="/docs/design-system" className="text-gray-900 hover:underline">
                Design System Hub
              </Link>{" "}
              guide; the related{" "}
              <Link href="/docs/branding" className="text-gray-900 hover:underline">
                Branding &amp; Assets
              </Link>{" "}
              and{" "}
              <Link href="/docs/context-docs" className="text-gray-900 hover:underline">
                Product Context
              </Link>{" "}
              pages cover the other tabs.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Explore Mode <span className="text-gray-400 font-normal text-sm">(right panel)</span>
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              The Explorer is an AI-powered design exploration surface.
              Enter a prompt, set the variant count (2 to 6), and generate
              multiple component options using your design tokens. Compare
              output with and without layout.md context, refine variants with
              follow-up prompts, push results to Figma, or save them to your
              component library. See the{" "}
              <Link href="/docs/explorer" className="text-gray-900 hover:underline">
                Explorer
              </Link>{" "}
              guide for full details.
            </p>
          </div>
        </div>
      </section>

      {/* Testing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Testing Your Design System</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Explorer is the best way to verify that layout.md actually
          improves AI output before exporting.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Comparison View</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            The comparison view generates the same component twice: once with
            your layout.md context active, once without. The side-by-side
            result shows you exactly what value your design system context is
            providing. A good context file produces noticeably better output
            with correct token usage, proper spacing, and on-brand typography.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Health Score</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Each generated variant shows a 0 to 100 health score measuring
            token faithfulness, component accuracy, and anti-pattern violations.
            Hover the score badge to see a grouped breakdown by rule type:
            colour token usage, spacing compliance, typography, accessibility,
            motion tokens, and more. The score runs 12 compliance checks
            covering hardcoded values, missing interactive states, semantic HTML,
            and accessibility attributes. Aim for 80+ before exporting to
            production.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Rating variants</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Every variant card has thumbs up and thumbs down buttons. Ratings
            are logged per-project and surfaced in the admin dashboard so the
            team can see which prompts are producing strong results and which
            are not. Use them freely; they feed back into prompt tuning.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Push to Figma</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Click the Figma icon on any variant to open the Push to Figma
            modal. Choose viewport sizes (mobile, tablet, desktop), optionally
            target an existing Figma file, and copy a ready-to-paste command for
            Claude Code or other AI agents with the Figma MCP server installed.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">AI Image Generation</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            When you prompt for layouts that include imagery (landing pages,
            hero sections, team pages), the AI generates real images using
            Google Gemini instead of placeholder services. Images are produced
            automatically after the component code is generated and seamlessly
            replace any placeholders in the preview. Requires a{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">GOOGLE_AI_API_KEY</code>{" "}
            environment variable.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">Fonts</h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Layout automatically detects fonts during extraction. From Figma,
            font families and weights are captured from typography styles. From
            websites, <code className="text-xs bg-gray-100 rounded px-1 py-0.5">@font-face</code> rules
            and computed font declarations are scraped directly.
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            For Google Fonts (the majority of design systems), Layout
            auto-detects the font families and injects them into component
            previews automatically. No configuration needed.
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            For custom or corporate typefaces not available on Google Fonts, open
            the <strong>Fonts</strong> tab in the Source Panel and upload your
            font files (.woff2, .woff, .ttf, .otf, max 5MB each). Uploaded
            fonts are:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-base text-gray-600">
            <li>Injected into Explorer variant previews via @font-face</li>
            <li>Included in the export bundle under <code className="text-xs bg-gray-100 rounded px-1 py-0.5">fonts/</code> with a generated <code className="text-xs bg-gray-100 rounded px-1 py-0.5">fonts.css</code></li>
            <li>Available for AI agents to use when generating components</li>
          </ul>
          <Callout type="info">
            No other design-to-code tool packages custom font files as part of
            the design system export. Most competitors assume fonts already exist
            in your codebase or fall back to system fonts.
          </Callout>
        </div>

        <Callout type="tip">
          If the health score is below 50, check that layout.md has well-formed
          CSS code blocks in the token sections. The AI needs parseable examples
          to reference at generation time.
        </Callout>
      </section>

      {/* Quality Score */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Quality Score</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Quality tab in the Source Panel shows your layout.md completeness
          score across 10 dimensions:
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
                ["Motion", "—"],
                ["Accessibility", "—"],
                ["Icons", "—"],
                ["Grid & Layout", "—"],
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
                <span className="font-semibold">{label}</span>. {desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Theme preference */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Theme preference</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Studio UI itself supports <strong>light</strong>,{" "}
          <strong>dark</strong>, and <strong>system</strong> modes (chosen in
          the profile menu). The preference is separate from the design
          system modes you&apos;re curating; it only affects the Studio
          chrome, modals, dropdowns, and variant preview surfaces.
        </p>
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
          layout.md is always included. Choose which additional formats to
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
                ["AGENTS.md", "AGENTS.md", "Codex, Jules, Factory, Amp. Any agent following agents.md spec"],
                ["Cursor Rules", ".cursor/rules/design-system.mdc", "Auto-applied rules in Cursor 0.43+"],
                ["CSS Tokens", "tokens.css", "Import directly into any stylesheet"],
                ["JSON Tokens", "tokens.json", "W3C DTCG format for Style Dictionary, Theo, etc."],
                ["Tailwind Config", "tailwind.config.js", "Theme extension with extracted colours, spacing, radii"],
                ["Custom Fonts", "fonts/*.woff2 + fonts/fonts.css", "Uploaded font files with @font-face declarations"],
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
          with no manual editing required. The Tailwind config uses{" "}
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
            <Link href="/docs/explorer" className="text-gray-900 hover:underline">
              Explorer
            </Link>{" "}
            for multi-variant generation, comparison view, and pushing to Figma.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI Guide
            </Link>{" "}
            to set up the MCP server for automatic design context in your AI agent.
          </li>
          <li>
            <Link
              href="/docs/integrations/claude-code"
              className="text-gray-900 hover:underline"
            >
              Claude Code integration
            </Link>{" "}
            to add the export files for persistent on-brand context.
          </li>
          <li>
            <Link
              href="/docs/integrations/cursor"
              className="text-gray-900 hover:underline"
            >
              Cursor integration
            </Link>{" "}
            to set up .cursorrules or MDC rules files.
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
