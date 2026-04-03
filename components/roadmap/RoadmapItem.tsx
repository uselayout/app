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
  item: Item;
  voted: boolean;
  voting: boolean;
  onVote: () => void;
}

export function RoadmapItem({ item, voted, voting, onVote }: Props) {
  return (
    <div
      className="flex items-start gap-4 rounded-lg px-4 py-3 transition-all"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Vote button */}
      <button
        onClick={onVote}
        disabled={voting}
        className="flex flex-col items-center gap-0.5 pt-0.5 min-w-[36px] transition-all"
        style={{
          color: voted ? "#e4f222" : "rgba(255,255,255,0.3)",
          opacity: voting ? 0.5 : 1,
          cursor: voting ? "wait" : "pointer",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
        <span className="text-xs font-medium">{item.voteCount}</span>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white/90">
            {item.title}
          </span>
          <ProductBadge product={item.product as ChangelogProduct} />
        </div>
        {item.description && (
          <p className="mt-1 text-xs text-white/45 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>
    </div>
  );
}
