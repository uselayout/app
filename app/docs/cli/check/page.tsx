import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "CI Compliance Gate (check) | Layout Docs",
  description:
    "The check command scans your UI source files against your design system rules and fails the build on violations. GitHub Actions annotations, changed-files-only mode, JSON output, and clear exit codes.",
};

const flags = [
  [
    "--ci",
    "Emits GitHub Actions annotations, so violations appear inline on the pull request diff.",
  ],
  [
    "--changed <ref>",
    "Checks only files changed versus the given base ref (e.g. origin/main). Keeps large repos fast and gates only what the PR touched.",
  ],
  [
    "--format json",
    "Machine-readable output: every violation with rule, file, line, offending value, and nearest-token suggestion. Default is a human-readable report.",
  ],
  [
    "--warnings-as-errors",
    "Treats warnings as errors, so any violation fails the gate.",
  ],
  [
    "--max-warnings <n>",
    "Allows up to n warnings before the gate fails. Useful for ratcheting an existing codebase down over time.",
  ],
  [
    "--exclude <globs>",
    "Glob patterns to skip, e.g. legacy directories or generated files.",
  ],
] as const;

const exitCodes = [
  ["0", "Pass. No violations beyond your thresholds."],
  ["1", "Gate failed. Violations exceeded the thresholds (errors, or warnings past --max-warnings)."],
  ["2", "Setup error. No .layout/ kit found, unreadable config, or similar. Fix the setup rather than the code."],
] as const;

const workflowYaml = `name: Design system compliance
on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed for --changed to resolve the base ref
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Check design system compliance
        run: npx @layoutdesign/context check --ci --changed origin/\${{ github.base_ref }}`;

export default function CliCheckPage() {
  const { prev, next } = getAdjacentPages("/docs/cli/check");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          CI Compliance Gate: the check Command
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            check
          </code>{" "}
          turns your design system into a CI gate. It scans your UI source
          files against the same rules the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            check_compliance
          </code>{" "}
          MCP tool and{" "}
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live
          </Link>{" "}
          use (hardcoded colours, hardcoded spacing, missing token references,
          unknown components) and fails the build when violations cross your
          threshold. Context tells the agent what on-brand means; check makes
          sure nothing off-brand merges anyway.
        </p>
      </div>

      {/* Usage */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Usage</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Run it from a project with a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/
          </code>{" "}
          kit (created by{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">init</code>{" "}
          or{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">import</code>
          ):
        </p>
        <CopyBlock code="npx @layoutdesign/context check" language="bash" />
        <p className="text-base text-gray-600 leading-relaxed">
          It scans the project&apos;s UI sources, prints each violation with
          the rule, file and line, the offending value, and the nearest design
          token as a suggested fix, then exits with a code CI can act on.
        </p>
      </section>

      {/* Flags */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Flags</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Flag</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  What it does
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.map(([flag, desc]) => (
                <tr key={flag} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                    {flag}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout type="tip">
          Adopting on an existing codebase? Start with{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            --changed
          </code>{" "}
          so only new work is gated, and use{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            --max-warnings
          </code>{" "}
          as a ratchet: set it to today&apos;s count and lower it every
          sprint.
        </Callout>
      </section>

      {/* Exit codes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Exit codes</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Code</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  Meaning
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exitCodes.map(([code, meaning]) => (
                <tr key={code} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                    {code}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GitHub Actions */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          GitHub Actions setup
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          A complete workflow that checks only the files a pull request
          changed and annotates violations inline on the diff:
        </p>
        <CopyBlock code={workflowYaml} language="yaml" />
        <p className="text-base text-gray-600 leading-relaxed">
          Commit your{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/
          </code>{" "}
          directory to the repo so CI has the kit to check against, the same
          way you commit an ESLint config.
        </p>
        <Callout type="info">
          check works in any CI system, not just GitHub Actions: without{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">--ci</code>{" "}
          it prints a plain report and the exit codes drive the pass/fail, and{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            --format json
          </code>{" "}
          feeds any custom reporting you run on top.
        </Callout>
      </section>

      {/* Where it fits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Where it fits in the golden path
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout enforces your design system at three points: the MCP server
          gives your agent the right context while it writes,{" "}
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live
          </Link>{" "}
          gates human tweaks to tokens as they happen, and check is the last
          line, catching anything off-system before it merges, whoever (or
          whatever) wrote it.
        </p>
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
