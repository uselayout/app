export const AI_KITS = [
  { name: "Linear", price: 99, aesthetic: "Developer tool, dark-first" },
  { name: "Revolut", price: 99, aesthetic: "Dark fintech, data-rich" },
  { name: "Stripe", price: 79, aesthetic: "Clean, trust-focused" },
  { name: "Notion", price: 79, aesthetic: "Document-first, flexible" },
  { name: "Vercel", price: 79, aesthetic: "Minimal, monochrome" },
  { name: "Apple iOS", price: 129, aesthetic: "HIG-compliant, light-first" },
];

interface AIKitsSectionProps {
  scrollTo: (id: string) => void;
}

export function AIKitsSection({ scrollTo }: AIKitsSectionProps) {
  return (
    <section id="ai-kits" className="py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Pre-Built AI Kits
          </p>
          <h2 className="mb-3 text-4xl font-bold text-[#0a0a0a] sm:text-5xl tracking-tight">
            Skip extraction. Drop in a kit.
          </h2>
          <p className="mx-auto max-w-lg text-base text-gray-500">
            Fully extracted design systems from the products your users already
            know. Full DESIGN.md, all tokens, all components.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_KITS.map((kit) => (
            <div
              key={kit.name}
              className="card-lift group relative rounded-2xl border border-black/[0.06] bg-white p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-1 font-semibold text-[#0a0a0a]">
                    {kit.name}
                  </h3>
                  <p className="text-sm text-gray-500">{kit.aesthetic}</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 shrink-0 ml-3">
                  £{kit.price}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400">
                Coming soon
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Need a different design system?{" "}
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
