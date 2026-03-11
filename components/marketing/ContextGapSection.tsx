import { X, MessageSquare, Sparkles } from "lucide-react";

const CARDS = [
  {
    icon: X,
    title: "Without context",
    desc: "Your AI hallucinates a design system. Every component looks different. Nothing matches your brand.",
    accent: false,
    iconColour: "text-red-400",
    iconBg: "bg-red-50",
    border: "border-black/[0.06]",
  },
  {
    icon: MessageSquare,
    title: "With manual prompting",
    desc: "You paste token values into every prompt. It works sometimes. It doesn\u2019t scale.",
    accent: false,
    iconColour: "text-amber-500",
    iconBg: "bg-amber-50",
    border: "border-black/[0.06]",
  },
  {
    icon: Sparkles,
    title: "With Layout",
    desc: "Your AI reads your design system automatically. Every build, on-brand.",
    accent: true,
    iconColour: "text-indigo-600",
    iconBg: "bg-indigo-50",
    border: "border-indigo-300",
  },
];

export function ContextGapSection() {
  return (
    <section className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            The Context Gap
          </p>
          <h2 className="mb-6 text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight leading-[1.1]">
            Your AI agent is brilliant.
            <br />
            And completely blind to your brand.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-500 leading-relaxed">
            AI coding agents can write entire features from a one-line prompt.
            But ask one to build a UI component and you&apos;ll get working code
            with completely the wrong design. The blue is off. The font weight
            is too heavy. The border radius doesn&apos;t match.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-[#0a0a0a]">
            This is the context gap. Your design system exists, but your AI
            can&apos;t see it.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, desc, accent, iconColour, iconBg, border }) => (
            <div
              key={title}
              className={`relative rounded-2xl border ${border} bg-white p-8 transition-all ${
                accent
                  ? "shadow-md ring-1 ring-indigo-200/60"
                  : "opacity-80"
              }`}
            >
              <div
                className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
              >
                <Icon size={20} className={iconColour} />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
