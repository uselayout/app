import { Link as LinkIcon, Sparkles, Download, Terminal } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: LinkIcon,
    title: "Paste a URL",
    desc: "Drop in a Figma file link or any live website URL. Figma or no Figma — both work.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Extraction runs",
    desc: "Colours, typography, spacing, components, and design tokens — extracted and synthesised into a structured DESIGN.md in under 2 minutes.",
  },
  {
    num: "03",
    icon: Download,
    title: "Download your AI kit",
    desc: "A ZIP bundle with CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, and tailwind.config.js. Every major AI tool covered.",
  },
  {
    num: "04",
    icon: Terminal,
    title: "Serve it to your AI",
    desc: "Run SuperDuper CLI. Your AI agent calls get_design_system automatically on every build prompt.",
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
            From URL to AI context in under 2 minutes.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
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
      </div>
    </section>
  );
}
