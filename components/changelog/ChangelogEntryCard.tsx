import type { ChangelogEntry } from "@/lib/types/changelog";
import { ProductBadge } from "./ProductBadge";
import { CategoryBadge } from "./CategoryBadge";

export function ChangelogEntryCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <CategoryBadge category={entry.category} />
        <ProductBadge product={entry.product} />
      </div>
      <h3 className="text-[15px] font-semibold text-white">{entry.title}</h3>
      <p className="text-sm leading-relaxed text-white/55">
        {entry.description}
      </p>
    </div>
  );
}
