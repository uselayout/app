import type { ChangelogWeek } from "@/lib/types/changelog";
import { ChangelogEntryCard } from "./ChangelogEntryCard";

export function ChangelogWeekGroup({ week }: { week: ChangelogWeek }) {
  return (
    <section>
      <time className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {week.label}
      </time>
      <div className="mt-6 flex flex-col gap-8 border-l border-white/10 pl-8">
        {week.entries.map((entry) => (
          <ChangelogEntryCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}
