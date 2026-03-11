import { Link as LinkIcon, Sparkles, Terminal } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: LinkIcon,
    title: "Paste a URL",
    desc: "Figma file or live website. We extract colours, typography, spacing, effects, components, and variables.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Get your DESIGN.md",
    desc: "Claude synthesises a 9-section context file optimised for LLM consumption. Not a token dump \u2014 structured, semantic, actionable.",
  },
  {
    num: "03",
    icon: Terminal,
    title: "Serve it to your AI",
    desc: "Export a ZIP, run two CLI commands. Your AI agent reads the design system on every prompt via MCP.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#fafafa] py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            How it Works
          </p>
          <h2 className="text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
            Three steps. Under two minutes.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ num, icon: Icon, title, desc }) => (
            <div
              key={num}
              className="card-lift relative rounded-2xl border border-black/[0.06] bg-white p-8"
            >
              <span className="step-num mb-6 block text-3xl font-black text-indigo-600/20">
                {num}
              </span>
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Icon size={20} className="text-indigo-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#0a0a0a]">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
        </div>

        {/* CLI snippet */}
        <div className="mx-auto mt-12 max-w-lg rounded-xl bg-[#0a0a0a] p-6">
          <pre className="text-sm leading-relaxed">
            <code>
              <span className="text-gray-500">$</span>{" "}
              <span className="text-emerald-400">npx</span>{" "}
              <span className="text-white">@superduperui/context import ./superduper-export.zip</span>
              {"\n"}
              <span className="text-gray-500">$</span>{" "}
              <span className="text-emerald-400">npx</span>{" "}
              <span className="text-white">@superduperui/context install</span>
              {"\n"}
              <span className="text-gray-500"># Done — your AI agent reads the design system automatically</span>
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
