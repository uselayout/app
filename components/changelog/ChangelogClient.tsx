"use client";

import { useState, useMemo } from "react";
import type { ChangelogProduct, ChangelogWeek } from "@/lib/types/changelog";
import { ChangelogFilters } from "./ChangelogFilters";
import { ChangelogWeekGroup } from "./ChangelogWeekGroup";

export function ChangelogClient({
  weeks,
  draftWeek,
}: {
  weeks: ChangelogWeek[];
  draftWeek: ChangelogWeek | null;
}) {
  const [filter, setFilter] = useState<ChangelogProduct | "all">("all");

  const filteredWeeks = useMemo(() => {
    if (filter === "all") return weeks;
    return weeks
      .map((week) => ({
        ...week,
        entries: week.entries.filter((e) => e.product === filter),
      }))
      .filter((week) => week.entries.length > 0);
  }, [weeks, filter]);

  const filteredDraft = useMemo(() => {
    if (!draftWeek) return null;
    if (filter === "all") return draftWeek;
    const filtered = {
      ...draftWeek,
      entries: draftWeek.entries.filter((e) => e.product === filter),
    };
    return filtered.entries.length > 0 ? filtered : null;
  }, [draftWeek, filter]);

  return (
    <>
      <div className="mt-8">
        <ChangelogFilters active={filter} onChange={setFilter} />
      </div>

      <div className="mt-16 flex flex-col gap-16">
        {filteredDraft && (
          <div className="rounded-lg border border-dashed border-amber-500/30 p-6">
            <span className="mb-4 inline-block rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Draft
            </span>
            <ChangelogWeekGroup week={filteredDraft} />
          </div>
        )}

        {filteredWeeks.map((week) => (
          <ChangelogWeekGroup key={week.weekId} week={week} />
        ))}

        {filteredWeeks.length === 0 && !filteredDraft && (
          <p className="text-sm text-white/40">
            No entries for this product yet.
          </p>
        )}
      </div>
    </>
  );
}
