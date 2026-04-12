import { RoadmapItem } from "./RoadmapItem";
import { ProductBadge } from "@/components/changelog/ProductBadge";
import type { ChangelogProduct } from "@/lib/types/changelog";

interface Item {
  id: string;
  title: string;
  description: string | null;
  product: string;
  voteCount: number;
}

interface Props {
  label: string;
  colour: string;
  items: Item[];
  votedIds: Set<string>;
  votingId: string | null;
  onVote: (id: string) => void;
}

const PRODUCT_ORDER = ["studio", "cli", "figma-plugin", "chrome-extension"];

export function RoadmapStatusGroup({ label, colour, items, votedIds, votingId, onVote }: Props) {
  // Group items by product
  const grouped = PRODUCT_ORDER
    .map((product) => ({
      product,
      items: items.filter((i) => i.product === product),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: colour }}
        />
        <h2
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: colour }}
        >
          {label}
        </h2>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {items.length}
        </span>
      </div>
      <div className="space-y-6">
        {grouped.map((group) => (
          <div key={group.product}>
            <div className="mb-2 ml-1">
              <ProductBadge product={group.product as ChangelogProduct} />
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <RoadmapItem
                  key={item.id}
                  item={item}
                  voted={votedIds.has(item.id)}
                  voting={votingId === item.id}
                  onVote={() => onVote(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
