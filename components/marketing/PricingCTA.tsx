interface PricingCTAProps {
  onOpenStudio: () => void;
}

export function PricingCTA({ onOpenStudio }: PricingCTAProps) {
  return (
    <section id="pricing" className="pricing-gradient relative py-28 px-6 text-center overflow-hidden">
      <div className="mx-auto max-w-3xl relative z-10">
        <h2 className="mb-5 text-4xl font-black text-white sm:text-5xl tracking-tight leading-tight">
          Free with your own API key.
        </h2>
        <p className="mb-12 text-lg text-indigo-200/80 sm:text-xl leading-relaxed max-w-lg mx-auto">
          Bring your Anthropic API key. Unlimited extractions, all export formats. No credit card required.
        </p>
        <button
          onClick={onOpenStudio}
          className="rounded-full bg-white px-10 py-4 text-base font-semibold text-[#0a0a0a] hover:bg-gray-50 transition-all shadow-lg shadow-black/10"
        >
          Open Studio and extract →
        </button>
      </div>
    </section>
  );
}
