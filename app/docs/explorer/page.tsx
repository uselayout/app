import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Explorer | Layout Docs",
  description:
    "AI-powered design exploration tool for generating multiple component variants from a single prompt, with image upload, refinement, and team review workflows.",
};

export default function ExplorerPage() {
  const { prev, next } = getAdjacentPages("/docs/explorer");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Explorer</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Explorer is an AI-powered design exploration tool built into
          the Studio. Enter a prompt, set how many variants to generate, and
          the AI produces multiple component options using your extracted design
          tokens, all in a single pass. Use it to explore directions quickly
          before committing to an implementation.
        </p>
      </div>

      {/* Features */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Features</h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Multi-variant generation
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Enter a prompt, set the variant count between 2 and 6, then press{" "}
              <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono">
                Cmd+Enter
              </kbd>{" "}
              to generate. The AI produces each variant independently using your
              extracted design tokens as context, so every output is on-brand
              without manual token lookup.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Image upload
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Attach a reference image to your prompt by pasting from the
              clipboard, dragging and dropping a file onto the canvas, or using
              the file picker. The AI uses the image as visual context alongside
              your prompt and design tokens, which is useful when you have a
              rough sketch, a screenshot of an existing UI, or a competitor
              reference to work from.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Variant refinement
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Select any generated variant and send a follow-up prompt to refine
              it. Refinement is iterative. You can repeat the cycle as many
              times as needed without losing the other variants in the grid.
              Each refinement pass maintains design token adherence.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Comparison view
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              The A/B comparison view generates the same component twice: once
              with your layout.md context active, once without. It displays
              them side by side. This is the fastest way to see the concrete
              value your design system context is providing to the AI.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Promote to Library
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Save any variant directly to your organisation's component library.
              Promoted variants automatically inherit the project's design tokens
              so they arrive in the library already wired up to your colour,
              typography, and spacing values.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              AI Image Generation
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              When you prompt for full-page layouts, marketing pages, or any
              component that includes imagery, the AI automatically generates
              real images using Google Gemini instead of placeholder services.
              Images are generated in parallel after the component code is
              produced, then seamlessly replaced in the preview. You can control
              image style (photo, illustration, icon, abstract) and aspect ratio
              through your prompt.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Push to Figma
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Select any variant and push it directly to a Figma file. The push
              modal lets you choose viewport sizes (mobile, tablet, desktop),
              optionally target an existing Figma file URL, and generates a
              ready-to-paste command for Claude Code or other AI agents with the
              Figma MCP server installed.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a]">
              Component Reuse
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              When codebase components are synced via{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                layout scan --sync
              </code>
              , the Explorer includes them in the AI generation context.
              Generated code includes production import comments showing exactly
              which components to use from your codebase. The preview renders
              correctly while the code shows your real import paths.
            </p>
          </div>

        </div>
      </section>

      {/* How to use */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How to use</h2>
        <ol className="space-y-4 text-gray-600">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              1
            </span>
            <p className="text-base leading-relaxed">
              Navigate to a project in the Studio that has already completed
              extraction and has a generated layout.md.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              2
            </span>
            <p className="text-base leading-relaxed">
              Switch to Explore mode using the toggle in the top bar. The
              three-panel editor will be replaced by the Explorer
              interface.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              3
            </span>
            <p className="text-base leading-relaxed">
              Enter a prompt describing the component or pattern you want to
              explore. For example: "a pricing card with three tiers" or
              "a navigation header with a search bar and user avatar".
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              4
            </span>
            <p className="text-base leading-relaxed">
              Optionally attach a reference image using paste, drag-drop, or the
              file picker.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              5
            </span>
            <p className="text-base leading-relaxed">
              Set the number of variants between 2 and 6, then press{" "}
              <kbd className="text-xs bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono">
                Cmd+Enter
              </kbd>{" "}
              to generate.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              6
            </span>
            <p className="text-base leading-relaxed">
              Review the generated variants in the grid view. Each variant is
              rendered live in an isolated sandbox.
            </p>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-[#0a0a0a] text-xs font-semibold flex items-center justify-center mt-0.5">
              7
            </span>
            <p className="text-base leading-relaxed">
              Select a variant to refine it with a follow-up prompt or promote it
              to the component library.
            </p>
          </li>
        </ol>
      </section>

      {/* Comparison view detail */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Using the comparison view
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The comparison view runs two parallel generation requests from the
          same prompt. The left pane uses your full layout.md context. The right
          pane sends the prompt with no design system context at all.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          A strong layout.md will produce a left-pane result with correct token
          values, consistent typography, and on-brand spacing, while the
          right-pane result defaults to generic Tailwind utility classes and
          arbitrary colours. If both panes look similar, your layout.md may need
          more specific token examples or stronger anti-pattern guidance.
        </p>
        <Callout type="tip">
          The comparison view is the fastest way to see how much value your
          layout.md provides. Run it before sharing your context bundle with the
          team.
        </Callout>
      </section>

      {/* Tips */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Tips</h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Tip</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Be specific in prompts",
                  "Reference the component type, state, and content structure. \"A card\" is vague. \"A product card with image, title, price, and a primary CTA\" gives the AI a clear target.",
                ],
                [
                  "Use reference images",
                  "Paste a screenshot of an existing component you want to riff on. The AI combines the visual reference with your design tokens for more accurate output.",
                ],
                [
                  "Start with 3-4 variants",
                  "Generating 6 variants takes longer and the marginal value drops off. Start with 3-4 to get a range of directions, then refine the best one.",
                ],
                [
                  "Promoted variants inherit tokens",
                  "You do not need to manually wire up colours or spacing after promoting. The library variant is already scoped to your project's design tokens.",
                ],
                [
                  "Refine iteratively",
                  "Submit follow-up prompts on a selected variant rather than regenerating from scratch. Each iteration builds on the previous output and converges faster.",
                ],
                [
                  "AI images need a Gemini key",
                  "Image generation requires a GOOGLE_AI_API_KEY environment variable. Without it, image placeholders will remain unprocessed. Self-hosted users should add this to their environment.",
                ],
              ].map(([tip, detail]) => (
                <tr key={tip} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap align-top">
                    {tip}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Callout type="info">
          The Explorer requires a project with a completed extraction and a
          generated layout.md. If the Explore mode toggle is disabled, generate
          layout.md in the Editor panel first.
        </Callout>

        <Callout type="warning">
          Push to Design System overwrites existing token values. Review the
          diff carefully before confirming the batch update, particularly if
          other team members have active projects using the same design system.
        </Callout>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/studio" className="text-gray-900 hover:underline">
              Studio Guide
            </Link>
            . Learn how to extract design tokens and generate layout.md before
            using the Explorer.
          </li>
          <li>
            <Link href="/docs/layout-md" className="text-gray-900 hover:underline">
              layout.md Spec
            </Link>
            . Understand what makes a strong context file so the Explorer
            generates better output.
          </li>
          <li>
            <Link
              href="/docs/integrations/claude-code"
              className="text-gray-900 hover:underline"
            >
              Claude Code integration
            </Link>
            . Take promoted variants into your codebase with the CLI and MCP
            server.
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
