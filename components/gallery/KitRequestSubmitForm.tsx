"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  isLoggedIn: boolean;
}

export function KitRequestSubmitForm({ isLoggedIn }: Props) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error" | "duplicate"; text: string } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login?redirect=/gallery");
      return;
    }
    if (busy || !url.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/kit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const body = (await res.json()) as {
        request?: { id: string; name: string };
        existing?: { id: string; name: string };
        duplicate?: boolean;
        error?: string;
      };
      if (res.ok && body.request) {
        setMessage({ kind: "ok", text: `Added "${body.request.name}". Refreshing…` });
        setUrl("");
        router.refresh();
        return;
      }
      if (res.status === 409 && body.existing) {
        setMessage({
          kind: "duplicate",
          text: `"${body.existing.name}" is already on the list.`,
        });
        return;
      }
      setMessage({ kind: "error", text: body.error ?? "Couldn't add that URL." });
    } catch {
      setMessage({ kind: "error", text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-stretch gap-3 mb-6 max-w-[640px]"
    >
      <input
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="linear.app or https://linear.app"
        aria-label="Kit URL"
        className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] text-[14px] text-[var(--mkt-text-primary)] placeholder:text-[var(--mkt-text-secondary)] focus:outline-none focus:border-[var(--mkt-accent)]"
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        <Plus className="w-4 h-4" aria-hidden />
        {busy ? "Adding…" : "Add to wishlist"}
      </button>
      {message ? (
        <p
          role="status"
          className={`sm:basis-full text-[13px] ${
            message.kind === "ok"
              ? "text-[var(--mkt-accent)]"
              : message.kind === "duplicate"
              ? "text-[var(--mkt-text-secondary)]"
              : "text-red-500"
          }`}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}
