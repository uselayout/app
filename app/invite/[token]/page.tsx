"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

type AcceptState = "idle" | "loading" | "success" | "error";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const token = typeof params?.token === "string" ? params.token : "";

  const [state, setState] = useState<AcceptState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user?.id) return;
    if (state !== "idle") return;
    if (!token) return;

    setState("loading");

    fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Failed to accept invitation");
          setState("error");
          return;
        }
        setState("success");
        router.push("/");
      })
      .catch(() => {
        setError("Something went wrong. Please try again.");
        setState("error");
      });
  }, [isPending, session?.user?.id, state, token, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-app)]">
        <p className="text-sm text-[var(--text-primary)]">
          Please log in to accept this invitation.
        </p>
        <Link
          href={`/login?next=/invite/${token}`}
          className="rounded-[var(--studio-radius-md)] bg-[var(--studio-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] transition-all duration-[var(--duration-base)] hover:bg-[var(--studio-accent-hover)]"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
        <p className="text-sm text-[var(--text-secondary)]">
          Accepting invitation...
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-app)]">
        <p className="text-sm text-[var(--status-error)]">
          {error}
        </p>
        <Link
          href="/"
          className="text-sm text-[var(--studio-accent)] transition-all duration-[var(--duration-base)] hover:text-[var(--studio-accent-hover)]"
        >
          Go to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
    </div>
  );
}
