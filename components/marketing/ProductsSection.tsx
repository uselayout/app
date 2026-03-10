import { Check } from "lucide-react";

interface ProductsSectionProps {
  onOpenStudio: () => void;
}

const STUDIO_BULLETS = [
  "Extract from Figma files or any live website",
  "Claude synthesises a structured DESIGN.md in under 2 minutes",
  "Test AI output with and without context — side by side",
  "Export to 6 formats: CLAUDE.md, AGENTS.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js",
];

const CLI_BULLETS = [
  "npx install — no config required",
  "Serves your DESIGN.md to AI agents via MCP",
  "AI calls get_design_system automatically when building UI",
  "Live component preview + push to Figma",
];

const FLOW_STEPS = [
  { label: "Figma / Website", accent: false },
  { label: "SuperDuper Studio", accent: true },
  { label: "AI Kit (ZIP)", accent: false },
  { label: "SuperDuper CLI", accent: true },
  { label: "AI Agent", accent: false },
];

export function ProductsSection({ onOpenStudio }: ProductsSectionProps) {
  return (
    <section id="products" className="bg-[#fafafa] py-28 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Products
          </p>
          <h2 className="text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
            Extract once. Build on-brand forever.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-16">
          {/* Studio card */}
          <div className="card-lift rounded-2xl border border-black/[0.06] bg-white p-8 sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              Web App — Extract &amp; Export
            </p>
            <h3 className="mb-6 text-2xl font-bold text-[#0a0a0a]">
              SuperDuper Studio
            </h3>
            <ul className="mb-8 space-y-3">
              {STUDIO_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                    <Check size={10} className="text-indigo-600" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
            <button
              onClick={onOpenStudio}
              className="rounded-full bg-[#0a0a0a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Open Studio →
            </button>
          </div>

          {/* CLI card */}
          <div className="card-lift rounded-2xl border border-black/[0.06] bg-white p-8 sm:p-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
              npm Package — Serve to AI Agents
            </p>
            <h3 className="mb-6 text-2xl font-bold text-[#0a0a0a]">
              SuperDuper CLI
            </h3>
            <ul className="mb-8 space-y-3">
              {CLI_BULLETS.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                    <Check size={10} className="text-indigo-600" strokeWidth={3} />
                  </span>
                  {bullet}
                </li>
              ))}
            </ul>
            <a
              href="/docs/cli"
              className="inline-block rounded-full bg-[#0a0a0a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors"
            >
              Install CLI →
            </a>
          </div>
        </div>

        {/* Workflow diagram */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {FLOW_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  step.accent
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {step.label}
              </span>
              {i < FLOW_STEPS.length - 1 && (
                <span className="text-gray-300 text-sm font-medium">→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
