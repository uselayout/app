import Link from "next/link";
import type { PublicKitSummary } from "@/lib/types/kit";

export function KitCard({ kit }: { kit: PublicKitSummary }) {
  return (
    <Link
      href={`/gallery/${kit.slug}`}
      className="group flex flex-col rounded-[16px] border border-[var(--mkt-border)] bg-[#101014] overflow-hidden transition-colors hover:border-white/20"
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#1a1a20] to-[#080705] overflow-hidden">
        {kit.previewImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kit.previewImageUrl}
            alt={`${kit.name} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--mkt-text-muted)] text-sm">
            No preview
          </div>
        )}
        {kit.featured && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-[var(--mkt-accent)] text-[#08090a] text-[11px] font-medium tracking-wide">
            Featured
          </div>
        )}
        {kit.tier === "rich" && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium tracking-wide backdrop-blur">
            Rich kit
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[18px] leading-[24px] text-[var(--mkt-text-primary)] font-medium">
            {kit.name}
          </h3>
          <span className="shrink-0 text-[12px] text-[var(--mkt-text-muted)]">
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
            {kit.author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={kit.author.avatarUrl}
                alt=""
                className="w-5 h-5 rounded-full bg-white/10"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/10" />
            )}
            <span className="text-[12px] text-[var(--mkt-text-muted)] truncate">
              {kit.author.displayName ?? "Layout community"}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[var(--mkt-text-muted)]">
            <span>{kit.upvoteCount} upvotes</span>
            <span className="text-white/20">|</span>
            <span>{kit.importCount} imports</span>
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
