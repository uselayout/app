import { Eye, Send, Wand2, ArrowLeftRight } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Eye,
    title: "Preview locally",
    desc: "See what your AI builds before it ships. Components render live at localhost:4321 with hot reload. Share the URL with your team.",
  },
  {
    icon: Send,
    title: "Push to Figma",
    desc: "One click. Three responsive frames (mobile, tablet, desktop). Editable auto-layout, real text, real styles. Ready for designer review \u2014 not a screenshot, an actual Figma component.",
  },
  {
    icon: Wand2,
    title: "Design in Figma",
    desc: "AI creates Figma mockups using your actual design tokens. Your designer refines instead of recreating. New screens start correct, not close.",
  },
  {
    icon: ArrowLeftRight,
    title: "Pull back to code",
    desc: "Designer tweaks the Figma frame \u2014 new spacing, different colour, updated copy. Your AI reads the changes via MCP. Code updates in seconds. The designer never leaves Figma. The developer never leaves the terminal.",
  },
];

const LOOP_STEPS = [
  "Extract tokens",
  "Generate code",
  "Preview",
  "Push to Figma",
  "Designer reviews",
  "Pull back to code",
];

export function FigmaLoopSection() {
  return (
    <section id="figma-loop" className="relative bg-[#0a0a0a] py-28 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            The Figma Closed Loop
          </p>
          <h2 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl tracking-tight mb-5 leading-[1.1]">
            Code → Figma → Code.
            <br />
            <span className="text-gray-400">The loop that actually closes.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-400 leading-relaxed">
            Every design-to-code tool is a one-way street.
            Layout closes the loop. Push AI-generated components to Figma
            as editable frames. Design new screens using your tokens.
            Pull designer changes back into code. No new tools. No friction.
          </p>
        </div>

        {/* Loop diagram */}
        <div className="my-14 flex items-center justify-center gap-2 flex-wrap">
          {LOOP_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gray-300">
                {step}
              </span>
              {i < LOOP_STEPS.length - 1 && (
                <span className="text-gray-600 text-sm font-medium">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Capability cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 hover:bg-white/[0.06] transition-all"
            >
              <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                <Icon
                  size={18}
                  className="text-indigo-400"
                />
              </div>
              <h3 className="mb-3 text-lg font-semibold text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-400">{desc}</p>
            </div>
          ))}
        </div>

        {/* Closing line */}
        <p className="mt-14 text-center text-base text-gray-500 leading-relaxed max-w-lg mx-auto">
          This isn&apos;t a bridge between two tools. It&apos;s a closed loop
          where code and design stay permanently in sync.
        </p>

        {/* Setup note */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Requires{" "}
          <a
            href="/docs/integrations/claude-code"
            className="underline underline-offset-2 hover:text-gray-400 transition-colors"
          >
            Figma MCP server
          </a>{" "}
          — free, OAuth, no API key needed.
        </p>
      </div>
    </section>
  );
}
