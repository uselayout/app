import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CopyBlock } from "@/components/shared/CopyBlock";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Round Trip: Gallery → Live | Layout Docs",
  description:
    "A complete worked example: import a kit from the Layout Gallery, install it into your project, tweak your running app in Layout Live, and hand the result off to Claude Code, all on-brand, all written to real source.",
};

const steps = [
  {
    n: 1,
    title: "Find a kit in the Gallery",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Open the{" "}
          <Link href="/gallery" target="_blank" rel="noopener noreferrer" className="text-gray-900 hover:underline">
            Kit Gallery
          </Link>{" "}
          and pick a design system to build against, say the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">linear-lite</code>{" "}
          kit. On the kit page you can preview it live (palette, type, spacing,
          components rendered in its own tokens), browse the full token set, and
          read the generated{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">layout.md</code>.
          Every kit page shows two ways in: <strong>Import to Studio</strong> and
          a CLI install command.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          For the Live workflow we want the kit on disk in our project, so we
          use the CLI command, but importing to Studio first is handy if you
          want to tweak the tokens or generate components before you start.
        </p>
      </>
    ),
  },
  {
    n: 2,
    title: "Install the kit and prepare the project for Live",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          From your project root, install the kit straight into a local{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">.layout/</code>{" "}
          directory and wire up the MCP server. Use the install command shown on
          the kit page:
        </p>
        <CopyBlock
          code="npx @layoutdesign/context install linear-lite --live"
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          The kit slug pulls the design system; the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">--live</code>{" "}
          flag also prepares the project for Layout Live. In one command this:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-base text-gray-600">
          <li>
            writes the kit&apos;s tokens and{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">layout.md</code>{" "}
            into{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">.layout/</code>
          </li>
          <li>registers the Layout MCP server with Claude Code / Cursor / Windsurf</li>
          <li>
            detects your framework and adds the Layout build plugin so the dev
            server tags every element with its source location
          </li>
          <li>
            creates{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">.layout/live/</code>{" "}
            (edit log, lock state, config) and a managed CLAUDE.md block
          </li>
        </ul>
        <Callout type="info">
          Already had a kit installed? Just add the flag:{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            npx @layoutdesign/context install --live
          </code>{" "}
          keeps your existing{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">.layout/</code>{" "}
          and only adds the Live plumbing. Re-running is safe and idempotent.
        </Callout>
      </>
    ),
  },
  {
    n: 3,
    title: "Start your dev server",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Run your app the way you always do. Note the URL it serves on:
        </p>
        <CopyBlock
          code={`npm run dev
# Next.js  → http://localhost:3000
# Vite     → http://localhost:5173`}
          language="bash"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Live never runs or restarts your dev server. It edits source files;
          your own server hot-reloads them. Keep this terminal running.
        </p>
      </>
    ),
  },
  {
    n: 4,
    title: "Open Layout Live and point it at the app",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Launch the Layout Live desktop app and enter your dev URL in the top
          bar (<code className="text-xs bg-gray-100 rounded px-1 py-0.5">http://localhost:3000</code>).
          Your app loads in an embedded Chromium view. Sign in with your Layout
          account so Live can resolve the{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">linear-lite</code>{" "}
          tokens you just installed, that is what powers the token-aware pickers
          and the compliance score.
        </p>
        <Callout type="warning">
          Point Live at the <em>same</em> project your dev server is running. If
          the URL in Live resolves to a different copy or a stray dev server,
          your edits write to files you can&apos;t see change. Live shows a
          mismatch banner when it detects this.
        </Callout>
      </>
    ),
  },
  {
    n: 5,
    title: "Click an element and tweak it",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Click a button in your running app. The overlay highlights it and the
          inspector fills with its real Tailwind classes. Now make it
          on-brand against the Linear kit:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base text-gray-600">
          <li>
            <strong>Scrub the padding.</strong> Drag the padding grip up a notch.
            Values snap to the kit&apos;s spacing scale, so you land on a real
            token (<code className="text-xs bg-gray-100 rounded px-1 py-0.5">px-4</code> → <code className="text-xs bg-gray-100 rounded px-1 py-0.5">px-5</code>),
            not an arbitrary value.
          </li>
          <li>
            <strong>Change the colour.</strong> Open the background picker, it is
            seeded with the Linear palette. Pick the accent token; the class
            updates to the token-backed utility.
          </li>
          <li>
            <strong>Round the corners.</strong> Nudge the radius to the
            kit&apos;s pill value.
          </li>
        </ul>
        <p className="text-base text-gray-600 leading-relaxed">
          Each change writes back to source immediately and your dev server
          hot-reloads it. Watch the file update in your editor as you scrub. The
          compliance score in the panel stays green because every value came
          from the kit.
        </p>
      </>
    ),
  },
  {
    n: 6,
    title: "Edit a token once, cascade everywhere",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Decide the kit&apos;s accent is a touch too blue for your product?
          Open the <strong>Tokens</strong> overlay and edit the accent token
          directly. Live writes the change through Layout&apos;s{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            update-tokens
          </code>{" "}
          API, so it cascades to <em>every</em> class that references it, and
          the web Studio picks up the same change next time you open the
          project. One edit, consistent everywhere.
        </p>
      </>
    ),
  },
  {
    n: 7,
    title: "Hand off to Claude Code for the structural change",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          You have the button looking right, but now you want a loading state
          with a spinner, that is logic, not a tweak. With the button still
          selected, click <strong>Hand off to AI</strong>. Live writes a
          paste-ready prompt (and a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/live/handoff.md
          </code>{" "}
          file) describing the selected element and your recent edits.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          In Claude Code, the Layout MCP server already exposes the live context.
          Just ask:
        </p>
        <CopyBlock
          code={`Add a loading state to the button I just selected in Live , 
spinner + disabled, using the existing accent token.`}
          language="text"
        />
        <p className="text-base text-gray-600 leading-relaxed">
          Claude calls{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            get-selected-element
          </code>{" "}
          to find the exact file and line, and{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            get-recent-visual-edits
          </code>{" "}
          to see the padding, colour and radius you just changed, so it builds
          the loading state on top of your tweaks instead of reverting them. It
          calls{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">lock-file</code>{" "}
          before writing so it doesn&apos;t collide with Live, then{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">unlock-file</code>{" "}
          when done. Back in Live, a diff banner shows what Claude changed, with
          Reload and Undo on hand.
        </p>
      </>
    ),
  },
  {
    n: 8,
    title: "Commit, it's all real code",
    body: (
      <>
        <p className="text-base text-gray-600 leading-relaxed">
          Nothing here is a throwaway mock. Every Live tweak and every Claude
          edit landed in your actual source files as Tailwind classes and token
          changes. Review the diff and commit:
        </p>
        <CopyBlock
          code={`git add -A
git commit -m "feat(ui): on-brand button with loading state"`}
          language="bash"
        />
      </>
    ),
  },
] as const;

export default function RoundTripPage() {
  const { prev, next } = getAdjacentPages("/docs/live/round-trip");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Round Trip: Gallery → Live
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The best way to understand how Layout&apos;s surfaces fit together is
          to follow one component all the way through: grab a design system from
          the Gallery, tweak a real component in your running app with Layout
          Live, and hand the structural work off to Claude Code, staying
          on-brand the whole way, with every change written to committable
          source.
        </p>
      </div>

      <Callout type="info">
        New to Live? Read the{" "}
        <Link href="/docs/live" className="text-gray-900 font-medium hover:underline">
          Layout Live overview
        </Link>{" "}
        first for the interface and concepts. This page is the end-to-end worked
        example.
      </Callout>

      {/* At a glance */}
      <section className="space-y-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 space-y-1">
          <h2 className="text-base font-semibold text-[#0a0a0a]">At a glance</h2>
          <p className="text-sm text-gray-600">
            Gallery (pick a kit) → CLI{" "}
            <code className="text-xs bg-white border border-gray-200 rounded px-1 py-0.5">
              install &lt;slug&gt; --live
            </code>{" "}
            → start dev server → open Live → click &amp; scrub → edit a token →
            hand off to Claude Code → commit.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="space-y-8">
        {steps.map(({ n, title, body }) => (
          <div key={n} className="space-y-3">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-[#0a0a0a]">
              <span className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-white text-base font-bold">
                {n}
              </span>
              {title}
            </h2>
            <div className="space-y-3 pl-11">{body}</div>
          </div>
        ))}
      </section>

      {/* Why this loop */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Why this loop matters
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The visual tweaks, padding, colour, radius, never cost a prompt and
          never drifted off-brand, because the kit&apos;s tokens were the only
          values on offer. The one change that genuinely needed reasoning, the
          loading state, went to Claude Code, which had perfect context on what
          you&apos;d already done. Studio defined the system, the Gallery
          distributed it, Live applied it, and the MCP server kept your agent in
          sync. That is the whole point of Layout: design system as the single
          source of truth, shared across every surface.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/live" className="text-gray-900 hover:underline">
              Layout Live overview
            </Link>{" "}
           , the full interface and editing model.
          </li>
          <li>
            <Link href="/docs/kit-gallery" className="text-gray-900 hover:underline">
              Kit Gallery
            </Link>{" "}
           , browsing, importing, and publishing kits.
          </li>
          <li>
            <Link href="/docs/cli" className="text-gray-900 hover:underline">
              CLI &amp; MCP Server
            </Link>{" "}
           , the install command, the Live MCP tools, and the rest of the
            toolset.
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
