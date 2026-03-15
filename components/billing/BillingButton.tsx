"use client";

import { useBilling } from "@/lib/hooks/use-billing";
import { Zap, Settings } from "lucide-react";

export function BillingButton() {
  const { tier } = useBilling();

  const handleClick = async () => {
    if (tier === "free") {
      window.location.href = "/pricing";
      return;
    }

    // Open Stripe Customer Portal for paid users
    const res = await fetch("/api/billing/portal", { method: "POST" });
    if (res.ok) {
      const { url } = await res.json();
      window.location.href = url;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
    >
      {tier === "free" ? (
        <>
          <Zap className="h-3 w-3" />
          Upgrade
        </>
      ) : (
        <>
          <Settings className="h-3 w-3" />
          Manage Plan
        </>
      )}
    </button>
  );
}
