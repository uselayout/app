import type { ChangelogWeek, ChangelogProduct } from "@/lib/types/changelog";
import { ProductBadge } from "./ProductBadge";
import { CategoryBadge } from "./CategoryBadge";

const PRODUCT_ORDER: ChangelogProduct[] = [
  "studio",
  "cli",
  "figma-plugin",
  "chrome-extension",
];

const PRODUCT_LABELS: Record<ChangelogProduct, string> = {
  studio: "Studio",
  cli: "CLI",
  "figma-plugin": "Figma Plugin",
  "chrome-extension": "Chrome Extension",
};

export function ChangelogWeekGroup({ week }: { week: ChangelogWeek }) {
  // Group items by product
  const grouped = PRODUCT_ORDER.map((product) => ({
    product,
    label: PRODUCT_LABELS[product],
    items: week.items.filter((item) => item.product === product),
  })).filter((group) => group.items.length > 0);

  return (
    <section>
      <time className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {week.label}
      </time>
      <div className="mt-4 border-l border-white/10 pl-8">
        <p className="text-[15px] leading-relaxed text-white/70">
          {week.summary}
        </p>
        <div className="mt-6 flex flex-col gap-6">
          {grouped.map((group) => (
            <div key={group.product}>
              <div className="mb-2">
                <ProductBadge product={group.product} />
              </div>
              <ul className="flex flex-col gap-1.5">
                {group.items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-white/55"
                  >
                    <span className="mt-0.5 shrink-0">
                      <CategoryBadge category={item.category} />
                    </span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
