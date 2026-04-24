import Link from "next/link";
import { Heart, Download } from "lucide-react";
import type { PublicKitSummary } from "@/lib/types/kit";
import { Avatar } from "./Avatar";
import { KitPreview } from "./KitPreview";

export function KitCard({ kit }: { kit: PublicKitSummary }) {
  return (
    <Link
      href={`/gallery/${kit.slug}`}
      className="group flex flex-col rounded-[16px] border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] overflow-hidden transition-all hover:border-[var(--mkt-text-muted)] hover:bg-[var(--mkt-surface-elevated)]"
    >
      <div className="relative">
        <KitPreview kit={kit} aspect="4/3" />
        {kit.featured && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[var(--mkt-accent)] text-[#08090a] text-[11px] font-medium tracking-wide">
            Featured
          </div>
        )}
        {kit.tier === "rich" && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface-elevated)] text-[var(--mkt-text-primary)] text-[11px] font-medium tracking-wide">
            Rich kit
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[18px] leading-[24px] text-[var(--mkt-text-primary)] font-medium">
            {kit.name}
          </h3>
          <span className="shrink-0 text-[12px] text-[var(--mkt-text-secondary)] px-2 py-0.5 rounded-full border border-[var(--mkt-border)]">
            {kit.licence}
          </span>
        </div>

        {kit.description && (
          <p className="text-[14px] leading-[20px] text-[var(--mkt-text-secondary)] line-clamp-2">
            {kit.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={kit.author.avatarUrl} name={kit.author.displayName} size={20} />
            <span className="text-[12px] text-[var(--mkt-text-secondary)] truncate">
              {kit.author.displayName ?? "Layout community"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[var(--mkt-text-muted)]">
            <span className="inline-flex items-center gap-1">
              <Heart className="w-3 h-3" aria-hidden />
              {kit.upvoteCount}
            </span>
            <span aria-hidden className="opacity-30">·</span>
            <span className="inline-flex items-center gap-1">
              <Download className="w-3 h-3" aria-hidden />
              {kit.importCount}
            </span>
          </div>
        </div>

        {kit.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {kit.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full border border-[var(--mkt-border)] text-[11px] text-[var(--mkt-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
