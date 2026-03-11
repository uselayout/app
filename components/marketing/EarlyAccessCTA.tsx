import { Users, Eye, Tag, Lightbulb } from "lucide-react";

const PERKS = [
  {
    icon: Users,
    text: "Direct access to the founding team via Discord",
  },
  {
    icon: Eye,
    text: "First look at every new feature before public release",
  },
  {
    icon: Tag,
    text: "Permanent founding member discount on Pro tier",
  },
  {
    icon: Lightbulb,
    text: "Your use case genuinely shaping the product",
  },
];

export function EarlyAccessCTA() {
  return (
    <section className="py-28 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
          Early Access
        </p>
        <h2 className="mb-6 text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
          Help us build this.
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-gray-500 leading-relaxed">
          SuperDuper is pre-alpha. We&apos;re onboarding 50 teams —
          designers and developers — who ship UI with AI agents
          and want to shape what gets built next. Direct founder access.
          First features. Founding member pricing.
        </p>

        {/* Perks */}
        <div className="mx-auto mb-10 grid max-w-lg gap-4 text-left">
          {PERKS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <Icon size={14} className="text-indigo-600" />
              </span>
              <span className="text-sm text-gray-600">{text}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/login"
            className="rounded-full bg-[#0a0a0a] px-8 py-3.5 text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-all shadow-lg shadow-black/10"
          >
            Apply for early access →
          </a>
          <a
            href="/docs/cli"
            className="rounded-full border border-black/10 bg-white px-8 py-3.5 text-sm font-semibold text-[#0a0a0a] hover:border-black/20 hover:bg-gray-50 transition-all"
          >
            Install CLI — free &amp; MIT
          </a>
        </div>
      </div>
    </section>
  );
}
