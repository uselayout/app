import { RoadmapItem } from "./RoadmapItem";

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

export function RoadmapStatusGroup({ label, colour, items, votedIds, votingId, onVote }: Props) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
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
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <RoadmapItem
            key={item.id}
            item={item}
            voted={votedIds.has(item.id)}
            voting={votingId === item.id}
            onVote={() => onVote(item.id)}
          />
        ))}
      </div>
    </section>
  );
}
