"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface DesignSystemSectionProps {
  id: string;
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DesignSystemSection({
  id,
  title,
  count,
  children,
  defaultOpen = true,
}: DesignSystemSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="scroll-mt-14">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 py-3 text-left group"
      >
        <ChevronDown
          className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-150 ${
            open ? "" : "-rotate-90"
          }`}
        />
        <h2 className="text-sm font-semibold text-[var(--text-primary)] tracking-wide uppercase">
          {title}
        </h2>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-[var(--bg-hover)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
            {count}
          </span>
        )}
      </button>
      {open && <div className="pb-8">{children}</div>}
    </section>
  );
}
