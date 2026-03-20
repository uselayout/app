import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "Windsurf | Layout Docs",
  description:
    "Configure Windsurf rules and import tokens.css so Cascade suggestions follow your design system.",
};

const windsurfRulesSnippet = `# Design System Rules

<!-- Paste Quick Reference from layout.md here -->`;

const tokensCssImportSnippet = `/* In your globals.css or app.css */
@import "./tokens.css";`;

const copyTokensSnippet = `cp path/to/export/tokens.css src/styles/tokens.css`;

export default function WindsurfPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/windsurf");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Windsurf</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Windsurf supports context injection via a rules file in your project
          root. Pair it with{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            tokens.css
          </code>{" "}
          in your stylesheet directory so Cascade suggestions naturally reference
          the correct token values.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 1: Create the rules file
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Add a{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  windsurf.rules
                </code>{" "}
                or{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  .windsurfrules
                </code>{" "}
                file to your project root. Paste the Quick Reference (Section 0)
                from your exported{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  layout.md
                </code>{" "}
                into it:
              </p>
              <CopyBlock code={windsurfRulesSnippet} language="markdown" />
              <p className="text-base text-gray-600 leading-relaxed">
                Windsurf reads this file automatically and injects the content as
                context on every Cascade prompt.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 2: Copy tokens.css into your project
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Copy{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  tokens.css
                </code>{" "}
                from your export bundle into your stylesheet directory:
              </p>
              <CopyBlock code={copyTokensSnippet} language="bash" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 3: Import tokens.css in your global stylesheet
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Import the file at the top of your global CSS to make all design
                tokens available as CSS custom properties throughout your
                project:
              </p>
              <CopyBlock code={tokensCssImportSnippet} language="css" />
              <p className="text-base text-gray-600 leading-relaxed">
                With the token values present in your source files, Cascade
                suggestions will naturally use the correct values when generating
                CSS or component styles.
              </p>
            </div>
          </div>
        </div>

        <Callout type="tip">
          Windsurf&apos;s Cascade also picks up context from files open in the
          editor. Keeping{" "}
          <code className="font-mono text-xs">layout.md</code> or{" "}
          <code className="font-mono text-xs">tokens.css</code> open in a tab
          during UI generation sessions gives Cascade the full token inventory
          to draw from.
        </Callout>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            Why tokens.css matters
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            The rules file tells Windsurf what design system to follow. The
            token file makes those values available as concrete CSS custom
            properties. When Cascade generates a component that uses{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              var(--color-primary)
            </code>
            , the actual value is defined in{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              tokens.css
            </code>
            , so there is no guesswork and no magic strings.
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
