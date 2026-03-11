import { Figma, ArrowLeftRight, Wand2, Eye, Send } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Eye,
    title: "Preview locally",
    desc: "Generated TSX renders at localhost:4321 — see exactly what your AI built before it touches your codebase.",
  },
  {
    icon: Send,
    title: "Push to Figma",
    desc: "One click in the Studio test panel copies a structured prompt. Paste into Claude Code — your component lands in Figma as an editable frame.",
  },
  {
    icon: Wand2,
    title: "Design in Figma",
    desc: "Prompt your AI to design directly in Figma using your extracted tokens. Colours, typography, and spacing — all on-brand from the start.",
  },
  {
    icon: ArrowLeftRight,
    title: "Pull changes back",
    desc: "Designer tweaks the Figma frame. Your AI reads the changes via Figma MCP and updates the code to match. The loop closes.",
  },
];

export function FigmaLoopSection() {
  return (
    <section className="relative bg-[#fafafa] py-28 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-1.5">
            <Figma size={14} className="text-[#0a0a0a]" />
            <span className="text-xs font-semibold text-[#0a0a0a]">
              Figma Integration
            </span>
          </div>
          <h2 className="text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight mb-4">
            Code ↔ Figma. Fully connected.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500 leading-relaxed">
            No other open-source tool closes the loop between AI-generated code
            and Figma. Preview, push, design, and pull — all through your AI
            agent.
          </p>
        </div>

        {/* Loop diagram */}
        <div className="my-14 flex items-center justify-center gap-2 flex-wrap">
          {[
            "Extract tokens",
            "Generate code",
            "Preview",
            "Push to Figma",
            "Designer reviews",
            "Pull back to code",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white border border-black/[0.08] px-4 py-1.5 text-xs font-semibold text-gray-600">
                {step}
              </span>
              {i < arr.length - 1 && (
                <span className="text-gray-300 text-sm font-medium">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Capability cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card-lift group rounded-2xl border border-black/[0.06] bg-white p-7"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Icon
                  size={18}
                  className="text-gray-400 group-hover:text-indigo-600 transition-colors"
                />
              </div>
              <h3 className="mb-2 text-base font-semibold text-[#0a0a0a]">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* Setup note */}
        <p className="mt-10 text-center text-sm text-gray-400">
          Requires{" "}
          <a
            href="/docs/integrations/claude-code"
            className="underline underline-offset-2 hover:text-gray-600 transition-colors"
          >
            Figma MCP server
          </a>{" "}
          — free, OAuth, no API key needed.
        </p>
      </div>
    </section>
  );
}
