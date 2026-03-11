import { Layers, Globe, FileText, RefreshCw, Terminal, Eye } from "lucide-react";

const FEATURES = [
  {
    icon: Layers,
    title: "Figma extraction",
    desc: "Connect to any Figma file. Pulls colour styles, typography, effects, and component inventory — actual values, not just metadata.",
  },
  {
    icon: Globe,
    title: "Website extraction",
    desc: "No Figma file? Point at any live URL. Layout Studio extracts design tokens from CSS and the DOM. No other tool does this.",
  },
  {
    icon: FileText,
    title: "Structured DESIGN.md",
    desc: "Not a token dump — a 9-section context file built for LLM consumption. Quick Reference, anti-patterns, component specs, and more.",
  },
  {
    icon: RefreshCw,
    title: "Re-extract any time",
    desc: "Design system updated? Paste the URL again. Your DESIGN.md stays in sync with the source of truth.",
  },
  {
    icon: Terminal,
    title: "MCP server built in",
    desc: "Layout CLI exposes 10 MCP tools. Your AI agent reads tokens, gets component specs, checks compliance, and previews output — without leaving the chat.",
  },
  {
    icon: Eye,
    title: "Figma closed loop",
    desc: "Preview components locally, push to Figma for designer review, or design directly in Figma using your tokens. Code ↔ Figma, fully connected.",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
            The full pipeline, end to end.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="card-lift group rounded-2xl border border-black/[0.06] bg-white p-8"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Icon size={20} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
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
