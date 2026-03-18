"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Check, Gift } from "lucide-react";
import type { InviteCode } from "@/lib/supabase/invite-codes";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://layout.design";

function inviteLink(code: string) {
  return `${APP_URL}/signup?code=${code}`;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3 animate-pulse">
      <div className="h-4 w-24 rounded bg-[var(--bg-elevated)]" />
      <div className="h-4 w-16 rounded bg-[var(--bg-elevated)]" />
      <div className="ml-auto h-7 w-20 rounded bg-[var(--bg-elevated)]" />
    </div>
  );
}

function CodeRow({ code }: { code: InviteCode }) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function markCopied() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCopied(true);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }

  function handleCopy() {
    const link = inviteLink(code.code);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        markCopied();
      }).catch(() => {
        // Fallback for HTTP contexts
        const el = document.createElement("textarea");
        el.value = link;
        document.body.appendChild(el);
        el.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(el);
        if (ok) markCopied();
      });
    } else {
      // No clipboard API available
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el);
      if (ok) markCopied();
    }
  }

  const redeemed = code.redeemedBy !== null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] px-4 py-3 transition-all duration-[var(--duration-base)] ease-[var(--ease-out)]">
      <span className="font-mono text-sm text-[var(--text-primary)]">
        {code.code}
      </span>
      <span
        className={`text-xs ${redeemed ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"}`}
      >
        {redeemed ? "Used" : "Available"}
      </span>
      <button
        onClick={handleCopy}
        className="ml-auto flex items-center gap-1.5 rounded-md border border-[var(--studio-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] ease-[var(--ease-out)] hover:border-[var(--studio-border-strong)] hover:text-[var(--text-primary)]"
      >
        {copied ? (
          <Check size={12} className="text-emerald-400" aria-hidden={true} />
        ) : (
          <Copy size={12} aria-hidden={true} />
        )}
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

export function InviteCodesPanel() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/invite-codes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load invite codes");
        return res.json() as Promise<{ codes: InviteCode[] }>;
      })
      .then((data) => {
        setCodes(data.codes);
      })
      .catch(() => {
        setError("Could not load invite codes. Please refresh and try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const available = codes.filter((c) => c.redeemedBy === null).length;

  return (
    <div className="rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center gap-2">
        <Gift className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          Invite Codes
        </p>
      </div>

      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {loading
          ? "Loading your invite codes…"
          : error
            ? null
            : codes.length === 0
              ? "No invite codes assigned to your account yet."
              : `You have ${available} invite${available !== 1 ? "s" : ""} to share. Give Layout access to people you think will love it.`}
      </p>

      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}

      {!error && (
        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            codes.map((code) => <CodeRow key={code.code} code={code} />)
          )}
        </div>
      )}

      {!loading && !error && codes.length > 0 && (
        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Share link format:{" "}
          <span className="font-mono">{APP_URL}/signup?code=…</span>
        </p>
      )}
    </div>
  );
}
