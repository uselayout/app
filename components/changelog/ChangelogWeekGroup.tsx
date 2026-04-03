import type { ChangelogWeek, ChangelogProduct, ChangelogCategory } from "@/lib/types/changelog";
import { ProductBadge } from "./ProductBadge";
import { CategoryBadge } from "./CategoryBadge";

const PRODUCT_ORDER: ChangelogProduct[] = [
  "studio",
  "cli",
  "figma-plugin",
  "chrome-extension",
];

const CATEGORY_ORDER: ChangelogCategory[] = ["new", "improved", "fixed"];

const PRODUCT_LABELS: Record<ChangelogProduct, string> = {
  studio: "Studio",
  cli: "CLI",
  "figma-plugin": "Figma Plugin",
  "chrome-extension": "Chrome Extension",
};

export function ChangelogWeekGroup({ week }: { week: ChangelogWeek }) {
  // Group items by product, then by category within each product
  const grouped = PRODUCT_ORDER.map((product) => {
    const productItems = week.items.filter((item) => item.product === product);
    const byCategory = CATEGORY_ORDER
      .map((cat) => ({
        category: cat,
        items: productItems.filter((item) => item.category === cat),
      }))
      .filter((g) => g.items.length > 0);

    return {
      product,
      label: PRODUCT_LABELS[product],
      byCategory,
      totalCount: productItems.length,
    };
  }).filter((group) => group.totalCount > 0);

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
              <div className="mb-3">
                <ProductBadge product={group.product} />
              </div>
              <div className="flex flex-col gap-3">
                {group.byCategory.map((catGroup) => (
                  <div key={catGroup.category}>
                    <ul className="flex flex-col gap-1.5">
                      {catGroup.items.map((item, i) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}
