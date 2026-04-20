import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Codebase Scanner | Layout Docs",
  description:
    "The Layout scanner reads your repository for React components and Storybook stories, then merges them with your extracted design system so Explorer and MCP agents can reuse code you already have.",
};

export default function ScannerPage() {
  const { prev, next } = getAdjacentPages("/docs/scanner");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Codebase Scanner</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The scanner reads your repository for React components and
          Storybook stories, then syncs them to your Layout project. Scanned
          components appear alongside Figma components in the Design System
          hub and feed into Explorer prompts, so the agent reuses what you
          already have instead of re-generating it.
        </p>
      </div>

      {/* What gets detected */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">What gets detected</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>React components</strong> — function exports, const
            exports, <code className="text-xs bg-gray-100 rounded px-1 py-0.5">forwardRef</code>, grouped exports, default
            exports. Props interfaces are resolved.
          </li>
          <li>
            <strong>Storybook stories (CSF3)</strong> — story names, tags,{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">argTypes</code>, and <code className="text-xs bg-gray-100 rounded px-1 py-0.5">args</code> are parsed so the agent knows
            the variants you already support.
          </li>
          <li>
            <strong>Import paths</strong> — resolved using the{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">@/</code>
            {" "}alias convention so generated code can import your components
            cleanly.
          </li>
        </ul>
        <Callout type="info">
          Storybook argTypes and stories are parsed today but not yet emitted
          to the <code className="text-xs bg-gray-100 rounded px-1 py-0.5">get_component</code> and <code className="text-xs bg-gray-100 rounded px-1 py-0.5">list_components</code> MCP tools.
          Coming in a follow-up.
        </Callout>
      </section>

      {/* Setup */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The scanner is part of the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            Layout CLI
          </Link>
          . After you&apos;ve run <code className="text-sm bg-gray-100 rounded px-1 py-0.5">init</code> and <code className="text-sm bg-gray-100 rounded px-1 py-0.5">install</code>, run the scan
          from the root of your repository:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context scan --sync --project <projectId>"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          You&apos;ll find the project ID in the Studio URL after opening a
          project. The <code className="text-sm bg-gray-100 rounded px-1 py-0.5">--sync</code> flag pushes scanned components to Layout;
          without it, the command is a dry run.
        </p>

        <h3 className="text-lg font-semibold text-[#0a0a0a] mt-6">Flags</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Flag</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Default</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">[path]</td>
                <td className="px-4 py-3 text-gray-600">cwd</td>
                <td className="px-4 py-3 text-gray-600">Directory to scan. Defaults to the current working directory.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">--sync</td>
                <td className="px-4 py-3 text-gray-600">off</td>
                <td className="px-4 py-3 text-gray-600">Push results to Layout. Without it, the scan prints locally.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">--project &lt;id&gt;</td>
                <td className="px-4 py-3 text-gray-600">—</td>
                <td className="px-4 py-3 text-gray-600">Layout project to sync into. Required with <code className="text-xs bg-gray-100 rounded px-1 py-0.5">--sync</code>.</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap">--type &lt;t&gt;</td>
                <td className="px-4 py-3 text-gray-600">all</td>
                <td className="px-4 py-3 text-gray-600">Limit to <code className="text-xs bg-gray-100 rounded px-1 py-0.5">components</code> or <code className="text-xs bg-gray-100 rounded px-1 py-0.5">stories</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Auto-scan */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Auto-scan on MCP start</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          When your AI agent starts the Layout MCP server, the scanner runs
          automatically on the linked project root. Typical runs finish in{" "}
          10–30 ms. You don&apos;t have to invoke <code className="text-sm bg-gray-100 rounded px-1 py-0.5">scan</code> manually for the
          agent to see your components.
        </p>
        <Callout type="tip">
          Run <code className="text-xs bg-gray-100 rounded px-1 py-0.5">scan --sync</code> explicitly when you want scanned components
          to show up in the Studio UI. The MCP-side scan feeds the agent but
          doesn&apos;t push to the Layout API.
        </Callout>
      </section>

      {/* Where scanned components show up */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Where scanned components show up</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Design System hub &rarr; Components view</strong> — merged
            with extracted Figma components so you see both sources side by
            side.
          </li>
          <li>
            <strong>Source Panel &rarr; Components tab</strong> — shows an
            empty state with setup instructions on projects that haven&apos;t
            been scanned yet.
          </li>
          <li>
            <strong>Explorer prompt context</strong> — scanned components are
            injected into the Component Inventory section so the agent can
            import rather than rebuild.
          </li>
          <li>
            <strong>MCP</strong> — <code className="text-xs bg-gray-100 rounded px-1 py-0.5">list_components</code> merges design system + codebase
            sources; <code className="text-xs bg-gray-100 rounded px-1 py-0.5">get_component</code> returns whichever has more detail.
          </li>
        </ul>
      </section>

      {/* Auto-rescan */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Auto-rescan on push</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Configure a{" "}
          <Link href="/docs/webhooks" className="text-gray-900 hover:underline">
            GitHub webhook
          </Link>
          {" "}pointing at your Layout project. On every push, the scanner
          re-runs against the updated tree and the component list refreshes
          automatically. Add or rename a component, push, and it shows up in
          Layout without a manual sync.
        </p>
      </section>

      {/* Known limits */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Known limits</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            Storybook <code className="text-xs bg-gray-100 rounded px-1 py-0.5">argTypes</code>, <code className="text-xs bg-gray-100 rounded px-1 py-0.5">args</code>, and story names are parsed but not
            yet exposed via <code className="text-xs bg-gray-100 rounded px-1 py-0.5">get_component</code> or <code className="text-xs bg-gray-100 rounded px-1 py-0.5">list_components</code>. Coming soon.
          </li>
          <li>
            Figma-to-code name matching uses normalised substring matching.
            Exact matches always win, but loose matches can surface
            unexpectedly. Rename Figma components closer to your code for
            best results.
          </li>
          <li>
            Icon-style components (e.g. <code className="text-xs bg-gray-100 rounded px-1 py-0.5">icon/alert-circle</code> in Figma) can
            flood the merged list when the Figma file ships a large icon
            set. Filter by type in the Components view to focus on UI
            components.
          </li>
        </ul>
      </section>

      {/* Related */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Related</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              Layout CLI
            </Link>
          </li>
          <li>
            <Link href="/docs/webhooks" className="text-gray-900 hover:underline">
              Webhooks
            </Link>{" "}— auto-rescan on every push.
          </li>
          <li>
            <Link href="/docs/component-library" className="text-gray-900 hover:underline">
              Saved Components
            </Link>{" "}— the Explorer-side library, distinct from codebase-scanned components.
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
