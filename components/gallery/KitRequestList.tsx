"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { KitRequestWithVote } from "@/lib/supabase/kit-requests";

interface Props {
  initialRequests: KitRequestWithVote[];
  isLoggedIn: boolean;
}

export function KitRequestList({ initialRequests, isLoggedIn }: Props) {
  if (initialRequests.length === 0) {
    return (
      <p className="text-[14px] text-[var(--mkt-text-secondary)] py-8">
        Nothing on the wishlist yet. Be the first to suggest a kit.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[920px]">
      {initialRequests.map((r) => (
        <KitRequestRow key={r.id} request={r} isLoggedIn={isLoggedIn} />
      ))}
    </ul>
  );
}

function KitRequestRow({
  request,
  isLoggedIn,
}: {
  request: KitRequestWithVote;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [upvoted, setUpvoted] = useState(request.hasUpvoted);
  const [count, setCount] = useState(request.upvoteCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!isLoggedIn) {
      router.push("/login?redirect=/gallery");
      return;
    }
    if (busy) return;
    const next = !upvoted;
    setUpvoted(next);
    setCount((c) => c + (next ? 1 : -1));
    setBusy(true);
    try {
      const res = await fetch(`/api/kit-requests/${request.id}/upvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const body = (await res.json()) as { upvoted: boolean };
      if (body.upvoted !== next) {
        setUpvoted(body.upvoted);
        setCount((c) => c + (body.upvoted ? 1 : -1));
      }
    } catch {
      setUpvoted(!next);
      setCount((c) => c + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  const faviconSrc = `https://www.google.com/s2/favicons?domain=${request.hostname}&sz=64`;

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)]">
      <img
        src={faviconSrc}
        alt=""
        width={32}
        height={32}
        className="w-8 h-8 rounded-md bg-[var(--mkt-bg)] shrink-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="flex-1 min-w-0">
        <a
          href={request.url}
          target="_blank"
          rel="noreferrer"
          className="block text-[14px] font-medium text-[var(--mkt-text-primary)] truncate hover:underline"
        >
          {request.name}
        </a>
        <span className="block text-[12px] text-[var(--mkt-text-secondary)] truncate">
          {request.hostname}
        </span>
      </div>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={upvoted}
        aria-label={upvoted ? "Remove upvote" : "Upvote this kit"}
        className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] transition-colors ${
          upvoted
            ? "border-[var(--mkt-accent)] bg-[color:color-mix(in_oklab,var(--mkt-accent)_14%,transparent)] text-[var(--mkt-text-primary)]"
            : "border-[var(--mkt-border-strong)] text-[var(--mkt-text-primary)] hover:bg-[var(--mkt-bg)]"
        }`}
      >
        <Heart className="w-3.5 h-3.5" fill={upvoted ? "currentColor" : "none"} aria-hidden />
        {count}
      </button>
    </li>
  );
}
