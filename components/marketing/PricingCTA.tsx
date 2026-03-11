import Link from "next/link";

interface PricingCTAProps {
  onOpenStudio: () => void;
}

export function PricingCTA({ onOpenStudio }: PricingCTAProps) {
  return (
    <section id="pricing" className="pricing-gradient relative py-28 px-6 text-center overflow-hidden">
      <div className="mx-auto max-w-3xl relative z-10">
        <h2 className="mb-5 text-4xl font-black text-white sm:text-5xl tracking-tight leading-tight">
          Open source. Free forever.
        </h2>
        <p className="mb-12 text-lg text-indigo-200/80 sm:text-xl leading-relaxed max-w-lg mx-auto">
          Bring your own API key and use it free, forever. Or go Pro for £29/month — hosted AI, unlimited extractions, and zero setup.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onOpenStudio}
            className="rounded-full bg-white px-10 py-4 text-base font-semibold text-[#0a0a0a] hover:bg-gray-50 transition-all shadow-lg shadow-black/10"
          >
            Open Studio — free →
          </button>
          <Link
            href="/pricing"
            className="rounded-full border border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all"
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
