import type { ChangelogProduct } from "@/lib/types/changelog";

const productConfig: Record<
  ChangelogProduct,
  { label: string; bg: string; text: string }
> = {
  studio: {
    label: "Studio",
    bg: "bg-white/10",
    text: "text-white/80",
  },
  cli: {
    label: "CLI",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
  },
  "figma-plugin": {
    label: "Figma Plugin",
    bg: "bg-violet-500/15",
    text: "text-violet-400",
  },
  "chrome-extension": {
    label: "Chrome Extension",
    bg: "bg-[var(--status-warning)]/15",
    text: "text-[var(--status-warning)]",
  },
};

export function ProductBadge({ product }: { product: ChangelogProduct }) {
  const config = productConfig[product];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
