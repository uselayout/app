import type { Metadata } from "next";
import Link from "next/link";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";

export const metadata: Metadata = {
  title: "GitHub Copilot | Layout Docs",
  description:
    "Persist your Layout design system as Copilot context via .github/copilot-instructions.md.",
};

const mkdirSnippet = `mkdir -p .github`;

const copilotInstructionsSnippet = `# Copilot Instructions

## Design System
<!-- Paste Section 0 (Quick Reference) from layout.md here -->`;

export default function CopilotPage() {
  const { prev, next } = getAdjacentPages("/docs/integrations/copilot");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">GitHub Copilot</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Copilot reads{" "}
          <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
            .github/copilot-instructions.md
          </code>{" "}
          as persistent project context. Add your design system there so
          Copilot&apos;s suggestions follow your token system without extra
          prompting.
        </p>
        <Callout type="info">
          Persistent instructions via{" "}
          <code className="font-mono text-xs">copilot-instructions.md</code>{" "}
          require Copilot Enterprise or the GitHub.com Copilot integration.
          Standard Copilot for Individuals uses open-file context only. See the
          tip below.
        </Callout>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 1: Create the .github directory
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                If it does not already exist, create the{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  .github
                </code>{" "}
                directory in your project root:
              </p>
              <CopyBlock code={mkdirSnippet} language="bash" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#0a0a0a]">
                Step 2: Create copilot-instructions.md
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Create{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  .github/copilot-instructions.md
                </code>{" "}
                and paste the Quick Reference section (Section 0) from your
                exported{" "}
                <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  layout.md
                </code>{" "}
                into it:
              </p>
              <CopyBlock code={copilotInstructionsSnippet} language="markdown" />
              <p className="text-base text-gray-600 leading-relaxed">
                Keep the content focused on your most-used tokens and component
                rules. Copilot will include this file as context on every
                suggestion in the project.
              </p>
            </div>
          </div>
        </div>

        <Callout type="tip">
          For inline completions (Copilot for Individuals), keep{" "}
          <code className="font-mono text-xs">layout.md</code> or{" "}
          <code className="font-mono text-xs">tokens.css</code> open in a
          separate editor tab. Copilot picks up context from all open files,
          and having the token definitions visible significantly improves completion
          quality.
        </Callout>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#0a0a0a]">
            What goes in the file
          </h2>
          <p className="text-base text-gray-600 leading-relaxed">
            The Quick Reference (Section 0 of layout.md) is the right content
            for this file. It covers:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600">
            <li>Core colour tokens and their intended usage</li>
            <li>Typography scale and font stack</li>
            <li>Spacing and sizing conventions</li>
            <li>Key component patterns and anti-patterns to avoid</li>
          </ul>
          <p className="text-base text-gray-600 leading-relaxed">
            The full{" "}
            <code className="text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded">
              layout.md
            </code>{" "}
            is also worth committing to your repo. Reference it from your
            instructions file for the complete token inventory.
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
