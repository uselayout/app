"use client";

import { useEffect, useState } from "react";
import { useOnboardingStore } from "@/lib/store/onboarding";
import { useOnboardingProgress } from "@/components/onboarding/OnboardingChecklist";
import { useMounted } from "@/lib/hooks/use-mounted";

interface SidebarProgressCardProps {
  collapsed: boolean;
}

export function SidebarProgressCard({ collapsed }: SidebarProgressCardProps) {
  const mounted = useMounted();
  const dismissed = useOnboardingStore((s) => s.dismissed);
  const openModal = useOnboardingStore((s) => s.openModal);
  const { completed, total, requiredDone } = useOnboardingProgress();

  // Fade the card out on completion instead of disappearing abruptly.
  const [exiting, setExiting] = useState(false);
  const [unmount, setUnmount] = useState(false);

  useEffect(() => {
    if (!requiredDone) {
      setExiting(false);
      setUnmount(false);
      return;
    }
    setExiting(true);
    const t = setTimeout(() => setUnmount(true), 600);
    return () => clearTimeout(t);
  }, [requiredDone]);

  if (!mounted) return null;
  if (dismissed) return null;
  if (unmount) return null;

  const pct = total === 0 ? 0 : (completed / total) * 100;

  const fadeStyle = exiting
    ? { opacity: 0, maxHeight: 0, overflow: "hidden", paddingTop: 0, paddingBottom: 0 }
    : undefined;
  const fadeClass = "transition-all duration-[400ms] ease-[cubic-bezier(0,0,0.2,1)]";

  if (collapsed) {
    return (
      <div className={`relative group px-1 pb-1 ${fadeClass}`} style={fadeStyle}>
        <button
          type="button"
          onClick={openModal}
          aria-label={`Onboarding progress, ${completed} of ${total} complete`}
          className="flex h-9 w-9 items-center justify-center rounded-[var(--studio-radius-md)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:bg-[var(--bg-hover)]"
        >
          <ProgressRing completed={completed} total={total} />
        </button>
        <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Get started — {completed} of {total}
        </div>
      </div>
    );
  }

  return (
    <div className={`px-1 pb-1 ${fadeClass}`} style={fadeStyle}>
      <button
        type="button"
        onClick={openModal}
        aria-label={`Open onboarding checklist, ${completed} of ${total} complete`}
        className="group flex w-full flex-col gap-2 rounded-[var(--studio-radius-md)] border border-[var(--studio-border-strong)] bg-[var(--bg-app)] p-3 text-left transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)] hover:border-[var(--studio-border-focus)] hover:bg-[var(--bg-hover)]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">
            Get started
          </span>
          <span className="font-mono text-[11px] tabular-nums text-[var(--text-muted)]">
            {completed}/{total}
          </span>
        </div>
        <div
          className="h-1 w-full rounded-full bg-[var(--bg-app)]"
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
        >
          <div
            className="h-1 rounded-full bg-[var(--studio-accent)] transition-all duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>
    </div>
  );
}

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const size = 22;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 0 : completed / total;
  const dash = circumference * pct;
  const center = size / 2;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--bg-app)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--studio-accent)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          className="transition-[stroke-dasharray] duration-[var(--duration-base)] ease-[cubic-bezier(0,0,0.2,1)]"
        />
      </svg>
      <span className="absolute font-mono text-[9px] font-medium tabular-nums text-[var(--text-secondary)]">
        {completed}
      </span>
    </div>
  );
}
