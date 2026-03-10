const STATS = [
  { stat: "500+", label: "Design tokens extracted per project" },
  { stat: "<2 min", label: "From URL paste to complete AI kit" },
  { stat: "6", label: "Export formats — one for every major AI coding tool" },
];

export function StatsStrip() {
  return (
    <section className="stats-gradient relative py-20 px-6 overflow-hidden">
      <div className="mx-auto max-w-4xl relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center text-white">
          {STATS.map(({ stat, label }, i) => (
            <div key={stat} className={`animate-fade-up delay-${(i + 1) * 100}`}>
              <p className="mb-2 text-5xl font-black tracking-tighter leading-none">
                {stat}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
