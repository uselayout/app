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
    <tr className="border-b border-white/[0.06] last:border-b-0">
      {/* Vote */}
      <td className="py-3 px-3 w-[50px] align-top">
        <button
          onClick={onVote}
          disabled={voting}
          className="flex flex-col items-center gap-0.5 transition-all"
          style={{
            color: voted ? "#e4f222" : "rgba(255,255,255,0.25)",
            opacity: voting ? 0.5 : 1,
            cursor: voting ? "wait" : "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span className="text-[11px] font-medium">{item.voteCount}</span>
        </button>
      </td>
      {/* Title */}
      <td className="py-3 px-3 align-top">
        <span className="text-sm font-medium text-white/90">{item.title}</span>
      </td>
      {/* Description */}
      <td className="py-3 px-3 align-top">
        <span className="text-sm text-white/50 leading-relaxed">
          {item.description || ""}
        </span>
      </td>
    </tr>
  );
}
