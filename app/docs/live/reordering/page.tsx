import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  GripVertical,
  Undo2,
  ShieldAlert,
} from "lucide-react";
import { Callout } from "@/components/docs/Callout";
import { getAdjacentPages } from "@/lib/docs/navigation";

export const metadata: Metadata = {
  title: "Reordering Elements | Layout Docs",
  description:
    "Move elements up and down in Layout Live with buttons, Alt+arrow shortcuts, or drag-and-drop from the selection toolbar. Every move is a surgical, individually undoable source edit, on plain HTML and React/Next pages alike.",
};

export default function LiveReorderingPage() {
  const { prev, next } = getAdjacentPages("/docs/live/reordering");

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[#0a0a0a]">
          Reordering Elements
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live
          </Link>{" "}
          can change the order of sibling elements, not just their styles.
          Swap two cards, move a section above another, pull a button to the
          front of a toolbar: each move is written back to your source as a
          surgical line edit, exactly like a class change, and each one is
          individually undoable.
        </p>
      </div>

      {/* Three ways to move */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <ArrowUpDown size={20} className="text-gray-500" /> Three ways to move
        </h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <strong>Move up / Move down buttons.</strong> With an element
            selected, the move controls swap it with its previous or next
            sibling. One click, one move.
          </li>
          <li>
            <strong>Alt+Up / Alt+Down.</strong> The same moves from the
            keyboard, for walking an element through a list quickly.
          </li>
          <li>
            <strong>Drag-and-drop.</strong> Grab the{" "}
            <GripVertical size={14} className="inline text-gray-500" /> grip on
            the floating selection toolbar and drag. A drop indicator shows
            where the element will land among its siblings, the page
            auto-scrolls when you drag near the top or bottom edge, and{" "}
            <strong>Escape cancels</strong> the drag with nothing written.
          </li>
        </ul>
        <p className="text-base text-gray-600 leading-relaxed">
          The floating selection toolbar is the small control strip anchored to
          the selection ring around the current element. Alongside the drag
          grip it holds edit text, ask AI, and the move buttons, so the common
          actions live on the element itself rather than in a distant panel.
          Selecting the right element is easy too: <strong>Alt+scroll</strong>{" "}
          walks up the parent chain with a breadcrumb showing where you are, so
          you can hop from a deeply nested span to the card that contains it in
          a couple of notches.
        </p>
      </section>

      {/* How the edit lands */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <Undo2 size={20} className="text-gray-500" /> Surgical edits, one undo each
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Reordering works on plain HTML pages and on React / Next.js pages
          alike. In both cases Live splices only the moved element&apos;s lines
          in the source file, it never regenerates the file around it, so the
          diff you commit is exactly the move and nothing else. Each move lands
          in the Edits panel as its own entry with a per-edit revert, and
          global undo (Cmd+Z) walks moves and style changes back in order.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          Repeated tweaks collapse sensibly too: if you nudge the same property
          on the same element a dozen times while experimenting, the Edits
          panel groups them into a single entry rather than burying the log in
          near-identical lines.
        </p>
      </section>

      {/* Refused moves */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a] flex items-center gap-2">
          <ShieldAlert size={20} className="text-gray-500" /> When a move is refused
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Some elements cannot be safely reordered by a text edit. The classic
          case is <strong>dynamic content</strong>: items rendered from a{" "}
          <code className="text-xs bg-gray-100 rounded px-1 py-0.5">
            .map()
          </code>{" "}
          over data, or blocks behind conditionals. Moving one of those in the
          source would not reorder the item you clicked, it would reorder (or
          break) the template that renders all of them. Live detects these
          cases and <strong>refuses the move</strong> rather than writing a
          change that does something different from what you asked.
        </p>
        <p className="text-base text-gray-600 leading-relaxed">
          When a move is refused, Live prompts you to{" "}
          <strong>ask the AI instead</strong>: one click files a prefilled{" "}
          <Link href="/docs/live/requests" className="text-gray-900 hover:underline">
            AI request
          </Link>{" "}
          describing the intended move, and your agent, which can reason about
          the data and the template, makes the change properly.
        </p>
        <Callout type="info">
          This is the same philosophy as the rest of Live: deterministic edits
          where determinism is safe, a routed handoff to the agent where it is
          not. Nothing is ever written that silently means something other
          than what you did on screen.
        </Callout>
      </section>

      {/* Compliance quick-fix pointer */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">
          Related: compliance quick-fix
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          The same selection toolbar workflow pairs with Live&apos;s compliance
          meter: expand it for a violations list with nearest-token suggestions
          and one-click <strong>Fix</strong> and <strong>Ask AI</strong>{" "}
          actions. It is documented in the{" "}
          <Link href="/docs/live" className="text-gray-900 hover:underline">
            Layout Live overview
          </Link>{" "}
          under the compliance score section.
        </p>
      </section>

      {/* Next steps */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-[#0a0a0a]">Next steps</h2>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>
            <Link href="/docs/live/requests" className="text-gray-900 hover:underline">
              AI Requests
            </Link>{" "}
           , the full pin-to-resolved loop for the moves Live will not make
            itself.
          </li>
          <li>
            <Link href="/docs/live/round-trip" className="text-gray-900 hover:underline">
              Round Trip: Gallery → Live
            </Link>{" "}
           , the end-to-end worked example.
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
