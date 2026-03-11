interface AIKitsSectionProps {
  scrollTo: (id: string) => void;
}

export function AIKitsSection({ scrollTo }: AIKitsSectionProps) {
  return (
    <section id="ai-kits" className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Coming Soon
          </p>
          <h2 className="mb-3 text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
            Skip extraction. Drop in a kit.
          </h2>
          <p className="mx-auto max-w-lg text-base text-gray-500">
            Pre-built AI Kits — fully extracted design systems from the products
            your users already know. Full DESIGN.md, all tokens, all components.
          </p>
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Can&apos;t wait?{" "}
          <button
            onClick={(e) => {
              e.preventDefault();
              scrollTo("extract");
            }}
            className="text-indigo-600 hover:underline"
          >
            Extract your own from any URL ↑
          </button>
        </p>
      </div>
    </section>
  );
}
