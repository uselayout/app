import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";
import { LAYOUT_UI_URL } from "@/lib/marketing/layout-ui";

export const metadata: Metadata = {
  title: "Layout UI | Layout Docs",
  description:
    "Layout UI is Layout's reskinnable component system: 54 components on a shared token contract, installable via the Layout CLI or the stock shadcn CLI, with every gallery kit available as a live theme.",
};

const uiHost = LAYOUT_UI_URL.replace(/^https?:\/\//, "");

export default function LayoutUiPage() {
  const { prev, next } = getAdjacentPages("/docs/layout-ui");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Layout UI</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout UI is Layout&apos;s own component system: 54 components built
          on a shared token contract, so every button, card, and dialog reads
          your design system&apos;s tokens automatically instead of shipping
          with hardcoded colours and spacing. It lives at{" "}
          <a
            href={LAYOUT_UI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            {uiHost}
          </a>
          , a separate site from Studio, and it works both in Layout projects
          and in any stock shadcn project.
        </p>
        <a
          href={LAYOUT_UI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          Open Layout UI
          <ArrowRight size={16} />
        </a>
      </div>

      {/* Installing components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Installing components
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Install any component with the Layout CLI. The first component you
          add automatically installs the matching theme for your project, so
          the colours and radii are correct from the first import:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context add button"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The CLI resolves and installs any dependent components for you,
          detects npm, pnpm, yarn, or bun automatically, and writes files
          straight into your project. Useful flags:
        </p>
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
              {[
                ["--registry", "Use a different component registry URL"],
                ["--dir", "Install into a specific directory instead of the detected components path"],
                ["--css", "Choose the CSS output target (globals.css by default)"],
                ["--overwrite", "Replace an existing component file instead of skipping it"],
                ["--dry-run", "Print what would be installed without writing any files"],
              ].map(([flag, desc]) => (
                <tr key={flag} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {flag}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* shadcn CLI */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Installing with the shadcn CLI
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout UI is also a standard shadcn registry, so it works with the
          stock shadcn CLI if that is already part of your workflow:
        </p>
        <CopyBlock code="npx shadcn add @layout/button" language="bash" />
        <p className="text-base text-gray-600 leading-relaxed">
          That resolves against{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            {uiHost}/r/{"{name}"}.json
          </code>
          . You can also point at that URL directly, without the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">@layout</code>{" "}
          namespace configured:
        </p>
        <CopyBlock
          code={`npx shadcn add https://${uiHost}/r/button.json`}
          language="bash"
        />
      </section>

      {/* Kit themes */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Every gallery kit is a theme
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Every kit in the{" "}
          <Link href="/docs/kit-gallery" className="text-gray-900 hover:underline">
            Kit Gallery
          </Link>{" "}
          is also published as a shadcn{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            registry:theme
          </code>{" "}
          item, compiled on request from the kit&apos;s style profile. Install
          the Stripe-style kit as a theme, for example:
        </p>
        <CopyBlock
          code="npx shadcn add https://layout.design/r/stripe/theme.json"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The same theme file works in a stock shadcn project (it emits
          shadcn&apos;s standard CSS variable names) and in a Layout UI
          project (it also emits the{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            --layout-*
          </code>{" "}
          extensions Layout UI components read for success/warning states and
          shadows), so one command re-skins either kind of project to match
          that kit&apos;s brand.
        </p>
        <Callout type="info">
          Theme URLs follow{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            layout.design/r/&lt;slug&gt;/theme.json
          </code>
          , where{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            &lt;slug&gt;
          </code>{" "}
          is any published kit&apos;s slug from the gallery. Themes stay in
          sync automatically: re-running the install command after a kit is
          updated pulls the latest tokens.
        </Callout>
      </section>

      {/* AI agent rules */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Built for AI agents
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Every one of the 54 components carries its own compliance rules
          rather than relying on prose an agent might skim past. Each registry
          item includes a{" "}
          <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
            meta
          </code>{" "}
          block with three fields:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Field</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">
                  What it tells the agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["meta.usage", "When and how to use this component correctly, in plain language"],
                ["meta.never", "Anti-patterns to avoid: variants not to mix, props not to combine"],
                ["meta.tokens", "Which design tokens the component consumes, so an agent knows not to hardcode them"],
              ].map(([field, desc]) => (
                <tr key={field} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {field}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          The full catalogue is also published as an{" "}
          <a
            href={`${LAYOUT_UI_URL}/llms.txt`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            llms.txt
          </a>{" "}
          file at the Layout UI site, so any agent that reads that convention
          can discover the component list, install commands, and rules
          without you pasting anything into a prompt.
        </p>
        <Callout type="tip">
          Combined with the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            Layout MCP server&apos;s
          </Link>{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            check_compliance
          </code>{" "}
          tool, an agent can both install a Layout UI component on-brand and
          verify any code it hand-writes against the same rules.
        </Callout>
      </section>

      {/* Building your own */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Building without leaving the browser
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The{" "}
          <a
            href={`${LAYOUT_UI_URL}/create`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-900 hover:underline"
          >
            /create
          </a>{" "}
          builder on the Layout UI site lets you assemble screens from the
          component set and a chosen theme directly in the browser, then copy
          the generated code out or install it with the CLI commands above.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <a
              href={`${LAYOUT_UI_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:underline"
            >
              Layout UI docs
            </a>{" "}
            &mdash; the full component reference, props, and examples.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI &amp; MCP Server
            </Link>{" "}
            &mdash; the rest of the{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              @layoutdesign/context
            </code>{" "}
            toolset, including{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              check_compliance
            </code>
            .
          </li>
          <li>
            <Link href="/docs/kit-gallery" className="text-gray-900 hover:underline">
              Kit Gallery
            </Link>{" "}
            &mdash; browse every kit publishable as a Layout UI theme.
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
