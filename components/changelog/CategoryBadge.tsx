import { CheckCircle, ArrowUpCircle, Sparkles } from "lucide-react";
import type { ChangelogCategory } from "@/lib/types/changelog";

const categoryConfig: Record<
  ChangelogCategory,
  { label: string; icon: typeof Sparkles; className: string }
> = {
  new: {
    label: "New",
    icon: Sparkles,
    className: "text-sky-400",
  },
  improved: {
    label: "Improved",
    icon: ArrowUpCircle,
    className: "text-white/50",
  },
  fixed: {
    label: "Fixed",
    icon: CheckCircle,
    className: "text-white/50",
  },
};

export function CategoryBadge({ category }: { category: ChangelogCategory }) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
