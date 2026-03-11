import Link from "next/link";
import { Github, Terminal, Package, Shield } from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Shield,
    stat: "MIT",
    label: "Licensed. Fork it, extend it, self-host it.",
  },
  {
    icon: Terminal,
    stat: "10",
    label: "MCP tools for your AI agent",
  },
  {
    icon: Package,
    stat: "3",
    label: "Free starter kits bundled (Linear, Stripe, Notion)",
  },
  {
    icon: Github,
    stat: "60s",
    label: "From npm install to your AI building on-brand",
  },
];

export function OpenSourceSection() {
  return (
    <section
      className="relative overflow-hidden py-28 px-6"
      style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0f0f1a 50%, #0a0a0a 100%)" }}
    >
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: "600px",
          height: "300px",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
            <Github size={14} />
            Open source
          </div>
          <h2 className="mb-5 text-4xl font-black tracking-tight text-white sm:text-5xl leading-tight">
            Open source. MIT licensed.
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-gray-400">
            The CLI and MCP server are free forever. Run it locally, deploy it
            yourself, contribute back — no subscriptions, no lock-in.
          </p>
        </div>

        {/* Stats grid */}
        <div className="mb-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map(({ icon: Icon, stat, label }) => (
            <div
              key={stat}
              className="card-lift group rounded-2xl border p-7"
              style={{
                background: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors group-hover:bg-indigo-500/20"
                style={{ background: "rgba(99,102,241,0.12)" }}
              >
                <Icon size={18} className="text-indigo-400" />
              </div>
              <p className="mb-1.5 text-4xl font-black tracking-tighter text-white leading-none">
                {stat}
              </p>
              <p className="text-sm leading-relaxed text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* npm install block */}
        <div
          className="mb-8 mx-auto max-w-2xl rounded-2xl border p-6"
          style={{
            background: "rgba(0,0,0,0.4)",
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500">
            Get started in 60 seconds
          </p>
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <Terminal size={16} className="shrink-0 text-indigo-400" />
            <code className="flex-1 font-mono text-sm text-gray-200 select-all">
              npx @layoutdesign/context init --kit linear-lite
            </code>
            <span className="shrink-0 rounded-full bg-indigo-500/15 px-3 py-1 text-xs font-medium text-indigo-300">
              free
            </span>
          </div>
        </div>

        {/* CTA links */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="https://github.com/uselayout/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#0a0a0a] transition-all hover:bg-gray-100 shadow-lg shadow-black/20"
          >
            <Github size={16} />
            View on GitHub
          </Link>
          <Link
            href="/docs/self-hosting"
            className="inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            Self-hosting docs →
          </Link>
        </div>
      </div>
    </section>
  );
}
