"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import type { Organization } from "@/lib/types/organization";

export default function StudioRedirect() {
  const router = useRouter();
  const { data: session } = useSession();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/organizations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch organisations");
        return res.json() as Promise<Organization[]>;
      })
      .then((orgs) => {
        const org =
          orgs.find((o) => o.slug.startsWith("personal-")) ?? orgs[0];
        if (org) {
          router.replace(`/${org.slug}`);
        } else {
          setError(true);
        }
      })
      .catch(() => {
        setError(true);
      });
  }, [session?.user?.id, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            Something went wrong setting up your workspace.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-[var(--studio-accent)] hover:text-[var(--studio-accent-hover)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <p className="text-sm text-[var(--text-muted)]">Redirecting…</p>
    </div>
  );
}
