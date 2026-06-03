import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  MousePointerClick,
  SlidersHorizontal,
  Palette,
  Image as ImageIcon,
  ShieldCheck,
  Bot,
  Monitor,
  GitBranch,
} from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Layout Live | Layout Docs",
  description:
    "Layout Live is the desktop app for tweaking your real running React app visually. Click an element, scrub a value, and a deterministic edit is written straight to your source, gated to your design tokens, with a live compliance score, no AI tokens spent. The use-the-system surface that pairs with Studio.",
};

const pillars = [
  {
    icon: MousePointerClick,
    title: "Click to select",
    description:
      "Point Live at your local dev server and click any element in the running app. An overlay highlights it and the properties panel populates with that element's real classes, selection survives hot-reload.",
  },
  {
    icon: SlidersHorizontal,
    title: "Scrub, don't prompt",
    description:
      "Drag-to-scrub padding, margin, gap, font size, weight, radius and sizing. Every drag is a deterministic, exact value that snaps to your design system scale, with a live compliance score flagging anything off-system. No 10–30 second AI round-trip for a 4px nudge, no tokens spent.",
  },
  {
    icon: Palette,
    title: "Edits write to source",
    description:
      "Every change is an AST edit to your actual Tailwind classes or tokens, not an overlay or a runtime patch. Your own dev server hot-reloads it, no cloud sandbox, no container, and the diff is real, committable code.",
  },
  {
    icon: Bot,
    title: "Hand off to AI",
    description:
      "When a tweak needs real logic, hand the selected element and your recent edits to Claude Code (or any agent) through the Layout MCP server. The agent picks up exactly what you changed.",
  },
] as const;

export default function LayoutLivePage() {
  const { prev, next } = getAdjacentPages("/docs/live");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">Layout Live</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout Live is a desktop app that turns your running React app into a
          direct-manipulation canvas. Click an element, scrub its padding, swap
          a colour for a real design token, change an icon, and the edit is
          written straight back to your source files as a Tailwind class or
          token change. It is the <strong>use-the-system</strong> surface that
          pairs with Studio&apos;s <strong>build-the-system</strong> surface.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          The pitch in one line: <strong>stop prompting for padding.</strong>{" "}
          Claude Code stays your IDE for logic and structure. Live is the
          surface you tab to when you just want to nudge spacing, colour and
          type without burning a prompt.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Three things set Live apart from every other visual editor. It edits
          your <strong>real running dev server</strong>, your own app, your own
          hot-reload, not a cloud sandbox or an IDE&apos;s embedded browser.
          Every drag is a <strong>deterministic AST edit</strong> to your
          Tailwind source: an exact value, written to disk, with no AI round-trip
          and no tokens spent. And every edit is{" "}
          <strong>gated to your design tokens</strong> with a live compliance
          score, so you stay on-system by construction rather than hand-typing an
          off-brand hex.
        </p>
      </div>

      <Callout type="info">
        Layout Live is a macOS desktop app in <strong>open alpha</strong>. Free
        to download now. It is built on Electron and ships signed and notarised
        by Apple, so it opens with a plain double-click. Windows is on the v1.1
        roadmap.{" "}
        <Link href="/live" className="font-medium text-indigo-600 hover:underline">
          Download Layout Live →
        </Link>
      </Callout>

      {/* Why */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Why Live exists</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          A large share of &ldquo;polish&rdquo; work with an AI coding agent is
          hundreds of tiny visual edits: padding, margin, gap, font weight,
          colour, border radius. Those edits are high-frequency, low-information
          (there is nothing for an LLM to <em>reason</em> about, you just know
          what looks right), slow through a prompt, and expensive in tokens.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Studio, the CLI, the Figma plugin and the Chrome extension all help
          with the <em>system</em> side, making sure AI uses the right tokens
          when it generates new code. None of them help with the{" "}
          <em>running app</em> side: making it trivial for a human to nudge
          those tokens once code is on screen. Live fills exactly that gap, and
          because every edit lands in real source, the result is committable
          code rather than a throwaway mock.
        </p>
      </section>

      {/* The four pillars */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">How it works</h2>
        <div className="space-y-4">
          {pillars.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-xl border border-gray-200 px-5 py-4"
            >
              <div className="shrink-0 mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Icon size={18} className="text-gray-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-[#0a0a0a]">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Callout type="tip">
          New here? The fastest way to understand Live is the{" "}
          <Link href="/docs/live/round-trip" className="text-gray-900 font-medium hover:underline">
            Round Trip: Gallery → Live
          </Link>{" "}
          walkthrough, it takes you from importing a kit out of the Gallery all
          the way to a tweaked, on-brand component handed off to Claude Code.
        </Callout>
      </section>

      {/* Live vs everything else */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Where Live sits in the product family
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Layout is a five-surface product. Studio defines what
          &ldquo;on-brand&rdquo; means; Live lets you stay on-brand while
          polishing the actual product.
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Surface</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "Studio (web)",
                  "Extract tokens from Figma/websites, refine layout.md, generate component variants in the Explorer.",
                ],
                [
                  "CLI & MCP",
                  "Install design context into a project; serve tools to AI agents over MCP.",
                ],
                [
                  "Chrome Extension",
                  "Inspect any website against your design system; check compliance scores.",
                ],
                [
                  "Figma Plugin",
                  "Extract tokens; push AI-generated components back as auto-layout frames.",
                ],
                [
                  "Live (desktop)",
                  "Tweak your running app visually; write back to source; hand off to Claude Code.",
                ],
              ].map(([surface, role]) => (
                <tr key={surface} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#0a0a0a] whitespace-nowrap align-top">
                    {surface}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          Live reads from Layout&apos;s token store, writes token changes back
          through the same APIs, and scores edits with the same compliance
          engine. It does not duplicate or replace anything, it is purely
          additive.
        </p>
      </section>

      {/* Setup */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Setup</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Two pieces: prepare your project once with the CLI, then open the
          desktop app and point it at your dev server.
        </p>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            1. Prepare your project
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            From your project root, run the Live install flow. This is the same{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              @layoutdesign/context
            </code>{" "}
            CLI you already use for the MCP server, with a{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              --live
            </code>{" "}
            flag:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-[#0a0a0a] px-4 py-3 text-sm text-gray-100">
            <code>npx @layoutdesign/context install --live</code>
          </pre>
          <p className="text-base text-gray-600 leading-relaxed">
            It detects your framework (Next.js or Vite), adds the Layout
            build plugin so the dev server tags each element with its source
            location, creates a{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              .layout/live/
            </code>{" "}
            directory for the edit log and lock state, and adds a small managed
            block to your{" "}
            <code className="text-sm bg-gray-100 rounded px-1.5 py-0.5">
              CLAUDE.md
            </code>{" "}
            so your agent knows Live is in play. Re-running it is idempotent.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[#0a0a0a]">
            2. Open Live and point it at your dev server
          </h3>
          <p className="text-base text-gray-600 leading-relaxed">
            Start your dev server as normal (<code className="text-xs bg-gray-100 rounded px-1 py-0.5">npm run dev</code>),
            launch the Layout Live app, and enter the dev URL (e.g.{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">http://localhost:3000</code>{" "}
            or <code className="text-xs bg-gray-100 rounded px-1 py-0.5">:5173</code> for Vite). Live
            embeds your app in a real Chromium webview, it is a top-level
            browser view, not an iframe, so most CSP and frame rules don&apos;t
            get in the way.
          </p>
        </div>

        <Callout type="warning">
          <strong>Live edits your source; your own dev server reloads it.</strong>{" "}
          Live writes the file and your Vite/Next dev server hot-reloads the
          change, Live never reloads the webview itself. If an edit
          doesn&apos;t appear, it is almost always because the URL in Live
          points at a <em>different</em> server (or copy of the project) than
          the one whose files are being edited. Point Live and your dev server
          at the same project root. Live shows a mismatch banner when it detects
          the on-screen element diverging from the parsed source.
        </Callout>
      </section>

      {/* The interface */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">The interface</h2>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
              <Monitor size={18} className="text-gray-500" /> Top bar
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Holds the editable dev URL with back / forward / reload wired to
              the embedded webview, a Tokens overlay, a Settings popover, a
              light/dark theme toggle, Float and Clear controls, and the{" "}
              <strong>Hand off to AI</strong> button. The whole UI follows a
              semantic theme that mirrors Studio&apos;s palette.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-gray-500" /> Inspector
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              The properties panel for the selected element. Numeric controls
              (padding, margin, gap, font size, radius, sizing) use a
              drag-to-scrub grip plus a number input, fine for ±1px, hold Shift
              for ±10px. Opacity keeps a slider. Enum controls (alignment,
              weight, display) carry icons. A nine-point anchor grid handles
              position / inset. Every numeric field offers your design system
              tokens as snap targets and dropdown suggestions, so it is hard to
              go off-scale.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
              <Palette size={18} className="text-gray-500" /> Fill, colour &amp; tokens
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Colour controls (text, background, border) open a picker seeded
              with your project token palette plus arbitrary values. The Tokens
              overlay lets you edit a design token directly, the change cascades
              to every class that references it and is written back through
              Layout&apos;s{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                update-tokens
              </code>{" "}
              API, so the web Studio sees it on next load.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
              <ImageIcon size={18} className="text-gray-500" /> Media: images, icons, SVG
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Beyond classes and tokens, Live edits media. Swap an{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">img</code>{" "}
              src or alt, set a background image, swap a Lucide icon (it renames
              the JSX tag and manages the import for you), or replace an inline
              SVG. The icon browser lists bundled Lucide names alongside any
              icon packs from your design system. Imported assets are written
              into your project&apos;s{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                public/icons/
              </code>{" "}
              and SVGs are sanitised on the way in.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-lg font-semibold text-[#0a0a0a] flex items-center gap-2">
              <ShieldCheck size={18} className="text-gray-500" /> Compliance &amp; viewports
            </h3>
            <p className="text-base text-gray-600 leading-relaxed">
              Live can show a compliance score for the selected element right in
              the panel (debounced, via the same{" "}
              <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
                check-compliance
              </code>{" "}
              engine Studio uses) so you can see at a glance whether a tweak
              stayed on-system. A multi-viewport preview switches between mobile,
              tablet and desktop presets.
            </p>
          </div>
        </div>
      </section>

      {/* Editing model */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          What Live edits (and what it doesn&apos;t)
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Live is deliberately scoped to visual properties. It is not a layout
          editor, not a no-code builder, and not a component creator. Anything
          structural routes back to Claude Code.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-base font-semibold text-[#0a0a0a]">In scope</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Spacing: padding, margin, gap (all directions)</li>
              <li>Typography: size, weight, family, line-height, letter-spacing</li>
              <li>Colour: text, background, border (token or arbitrary)</li>
              <li>Border radius and sizing</li>
              <li>Position / inset via the anchor grid</li>
              <li>Design tokens (cascades to all dependent classes)</li>
              <li>Media: image src/alt, background image, icon swap, inline SVG</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-5 space-y-2">
            <h3 className="text-base font-semibold text-[#0a0a0a]">
              Routes to Claude Code
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
              <li>Flexbox direction, grid templates, layout structure</li>
              <li>Adding, removing or moving elements</li>
              <li>Component composition and new components</li>
              <li>Anything that needs logic or data</li>
              <li>CSS-in-JS and CSS modules (Tailwind only in v1)</li>
            </ul>
          </div>
        </div>
        <Callout type="info">
          v1 targets React with Next.js or Vite, Tailwind classes, on{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">localhost</code>.
          Vue, Astro, layout-property edits and remote dev URLs are on the
          roadmap, not at launch.
        </Callout>
      </section>

      {/* Reduced mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Reduced mode (no Layout account needed)
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Live works on any Tailwind project even without a Layout design
          system. In reduced mode it reads your{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            tailwind.config
          </code>{" "}
          directly for scale and token suggestions, and the compliance score is
          hidden. Connect a Layout project to unlock token-aware pickers,
          cascade-on-token-edit, and live compliance scoring.
        </p>
      </section>

      {/* Claude integration */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <GitBranch size={20} className="text-gray-500" /> Working alongside Claude Code
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Live and Claude Code share the same files and the same{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            Layout MCP server
          </Link>
          . Live adds four MCP tools so your agent always has live context:
        </p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left">
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">Tool</th>
                <th className="px-4 py-3 font-semibold text-[#0a0a0a]">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "get-selected-element",
                  'The element currently selected in Live, file, line, component, classes. Lets you say "make this bigger" and have the agent know what "this" is.',
                ],
                [
                  "get-recent-visual-edits",
                  'The class/token changes you just made. Ask "what did I just change?" and the agent reads the edit log.',
                ],
                [
                  "lock-file",
                  "Reserves a file before the agent edits it, so Claude and Live don't clobber each other's writes.",
                ],
                [
                  "unlock-file",
                  "Releases the lock once the agent's edit is done.",
                ],
              ].map(([tool, desc]) => (
                <tr key={tool} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap pt-3.5">
                    {tool}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-base text-gray-600 leading-relaxed">
          The <strong>Hand off to AI</strong> button writes a paste-ready,
          agent-agnostic prompt (and a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/live/handoff.md
          </code>{" "}
          file) describing the selected element and your recent edits, so you
          can drop straight into Claude Code, Cursor or Codex and keep going.
          When the agent edits a file you have open in Live, a non-blocking diff
          banner appears with View diff, Reload, and Undo options.
        </p>
        <Callout type="tip">
          These four tools ship in the Layout MCP server and return a clean
          &ldquo;not running&rdquo; response when Live is closed, so they never
          break an agent session. Full tool reference on the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            CLI &amp; MCP
          </Link>{" "}
          page.
        </Callout>
      </section>

      {/* Troubleshooting */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Troubleshooting</h2>
        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            {
              problem: "My edit doesn't show up on localhost",
              fix: "Almost always a dev-server mismatch, not a bug. Live writes the file and your own dev server hot-reloads it, make sure the URL in Live points at the same project your dev server is running. If you have multiple copies or stray dev servers (common with git worktrees), kill the stray ones and re-point Live.",
            },
            {
              problem: "Nothing happens when I click an element",
              fix: "The source-location tags come from the Layout build plugin. Re-run npx @layoutdesign/context install --live and restart your dev server so the plugin is active in dev.",
            },
            {
              problem: "Claude overwrote a tweak I just made",
              fix: "Open the diff banner and choose Undo, or ask the agent to call get-recent-visual-edits. Enabling the optional Claude Code hook lets Live know the moment a file is edited so the banner appears immediately.",
            },
            {
              problem: "Compliance score is missing",
              fix: "Compliance scoring only appears when a Layout project is connected. In reduced mode (Tailwind config only) the score is intentionally hidden.",
            },
          ].map(({ problem, fix }) => (
            <div key={problem} className="px-5 py-4 space-y-1">
              <p className="text-sm font-semibold text-[#0a0a0a]">{problem}</p>
              <p className="text-sm text-gray-600">{fix}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/live/round-trip" className="text-gray-900 hover:underline">
              Round Trip: Gallery → Live
            </Link>{" "}
           , the full worked example from importing a kit to handing off to
            Claude Code.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI &amp; MCP Server
            </Link>{" "}
           , the install flow, the four Live MCP tools, and the rest of the
            toolset.
          </li>
          <li>
            <Link href="/docs/kit-gallery" className="text-gray-900 hover:underline">
              Kit Gallery
            </Link>{" "}
           , where you grab a design system to point Live at.
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
