import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Palette,
  Component,
  BookOpen,
} from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "The Design Tab | Layout Docs",
  description:
    "Layout Live's Design tab puts your whole design system inside the app: edit tokens with an instant page preview and separate light and dark values, browse the component inventory with copyable code, and read layout.md guidelines rendered readably.",
};

export default function LiveDesignTabPage() {
  const { prev, next } = getAdjacentPages("/docs/live/design-tab");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">The Design Tab</h1>
        <p className="text-base text-gray-600 leading-relaxed">
          The Design tab brings your whole design system into{" "}
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live
          </Link>
          , so you never have to switch to the web Studio to answer &ldquo;what
          tokens do we have?&rdquo; or &ldquo;what does the Button spec
          say?&rdquo; while tweaking a page. It has three views:{" "}
          <strong>Tokens</strong>, <strong>Components</strong>, and{" "}
          <strong>Guidelines</strong>.
        </p>
      </div>

      {/* Tokens */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Palette size={20} className="text-gray-500" /> Tokens
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Tokens view lists every design token in the connected kit, and
          they are <strong>editable in place</strong>. Change a value and the
          running page previews it instantly, before anything is saved, so you
          can judge a new brand colour or spacing scale against your real app
          rather than a swatch. Save to commit, or discard to snap back.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Instant preview.</strong> Edits apply to the page live
            while you type or scrub, ahead of saving. What you see is your
            actual product wearing the new value.
          </li>
          <li>
            <strong>Light and dark, separately.</strong> Each token exposes its
            light and dark values as distinct fields, so tuning the dark theme
            never touches the light one (and vice versa).
          </li>
          <li>
            <strong>Writes to the real files.</strong> Saving persists the
            change to{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              tokens.css
            </code>
            ,{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              tokens.json
            </code>
            , and{" "}
            <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
              layout.md
            </code>{" "}
            together, so the kit stays consistent for the MCP server, Studio,
            and every agent reading it.
          </li>
          <li>
            <strong>Undoable.</strong> Token saves join the same undo stack as
            class edits: Cmd+Z reverses one, and the Edits panel lists it with
            a per-edit revert.
          </li>
        </ul>
        <Callout type="tip">
          Because a token cascades to every class that references it, the
          Tokens view is the fastest way to restyle a whole page at once.
          One edit to{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            --color-primary
          </code>{" "}
          restyles every primary button in the app, live.
        </Callout>
      </section>

      {/* Components */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Component size={20} className="text-gray-500" /> Components
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Components view shows the design system&apos;s component
          inventory, the same one your agent sees through{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            list_components
          </code>
          . Each component entry carries its spec and a{" "}
          <strong>copyable code example</strong>, so when you spot a hand-rolled
          card that should have been the Card component, the correct usage is
          one copy button away.
        </p>
      </section>

      {/* Guidelines */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <BookOpen size={20} className="text-gray-500" /> Guidelines
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The Guidelines view renders your{" "}
          <Link href="/docs/layout-md" className="text-gray-900 hover:underline">
            layout.md
          </Link>{" "}
          sections readably: colour rules, typography scale, spacing grid,
          anti-patterns, the lot. It is the human-readable face of the same
          file your agent consumes, useful for checking what the system
          actually says before you override it.
        </p>
      </section>

      {/* Reduced mode */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Reduced mode</h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The full Design tab requires the project to be prepared with the CLI
          (
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            npx @layoutdesign/context install --live
          </code>
          ), which is what gives Live a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .layout/
          </code>{" "}
          kit to read and write. On a plain Tailwind project without the CLI,
          Live runs in reduced mode: token suggestions come from your Tailwind
          config, and the Design tab&apos;s editing, components, and guidelines
          views are unavailable. See the{" "}
          <Link href="/docs/cli" className="text-gray-900 hover:underline">
            CLI guide
          </Link>{" "}
          for the one-command setup.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/live/reordering" className="text-gray-900 hover:underline">
              Reordering Elements
            </Link>{" "}
           , move and drag elements with surgical, undoable source edits.
          </li>
          <li>
            <Link href="/docs/design-system" className="text-gray-900 hover:underline">
              Design System Hub
            </Link>{" "}
           , the web Studio&apos;s token curation and editing surfaces.
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
