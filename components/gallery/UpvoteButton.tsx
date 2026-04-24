"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";

interface Props {
  slug: string;
  initialCount: number;
  initiallyUpvoted: boolean;
  isLoggedIn: boolean;
}

// Heart toggle. Optimistic: bumps the count immediately, reverts if the
// server says otherwise. Logged-out users get bounced to /login?redirect=...
// so they come back to the same kit after signing in.
export function UpvoteButton({ slug, initialCount, initiallyUpvoted, isLoggedIn }: Props) {
  const router = useRouter();
  const [upvoted, setUpvoted] = useState(initiallyUpvoted);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/gallery/${slug}`);
      return;
    }
    if (busy) return;
    const nextUpvoted = !upvoted;
    setUpvoted(nextUpvoted);
    setCount((c) => c + (nextUpvoted ? 1 : -1));
    setBusy(true);
    try {
      const res = await fetch(`/api/kits/${slug}/upvote`, { method: "POST" });
      if (!res.ok) throw new Error("upvote failed");
      const body = (await res.json()) as { upvoted: boolean };
      if (body.upvoted !== nextUpvoted) {
        // Server disagreed; reconcile without waiting for a refetch.
        setUpvoted(body.upvoted);
        setCount((c) => c + (body.upvoted ? 1 : -1));
      }
    } catch {
      // Revert optimistic update.
      setUpvoted(!nextUpvoted);
      setCount((c) => c + (nextUpvoted ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={upvoted}
      aria-label={upvoted ? "Remove upvote" : "Upvote this kit"}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border transition-colors ${
        upvoted
          ? "border-[var(--mkt-accent)] bg-[color:color-mix(in_oklab,var(--mkt-accent)_14%,transparent)] text-[var(--mkt-text-primary)]"
          : "border-[var(--mkt-border-strong)] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-surface-elevated)]"
      }`}
    >
      <Heart
        className="w-4 h-4"
        fill={upvoted ? "currentColor" : "none"}
        aria-hidden
      />
      <span className="text-[13px]">{count}</span>
    </button>
  );
}
