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
    <tr className="border-b border-[var(--studio-border)] last:border-b-0">
      {/* Vote */}
      <td className="py-3 px-3 w-[56px] align-top">
        <button
          onClick={onVote}
          disabled={voting}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-all"
          style={{
            color: voted ? "#e4f222" : "var(--text-muted)",
            background: voted ? "rgba(228,242,34,0.08)" : "var(--studio-accent-subtle)",
            border: `1px solid ${voted ? "rgba(228,242,34,0.2)" : "var(--studio-border)"}`,
            opacity: voting ? 0.5 : 1,
            cursor: voting ? "wait" : "pointer",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
          <span className="text-xs font-semibold">{item.voteCount}</span>
        </button>
      </td>
      {/* Title + Description */}
      <td className="py-3 px-3 align-top" colSpan={2}>
        <span className="text-sm font-medium text-[var(--text-primary)]">{item.title}</span>
        {item.description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)] leading-relaxed">{item.description}</p>
        )}
      </td>
    </tr>
  );
}
