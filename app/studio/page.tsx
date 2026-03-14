"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

export default function StudioRedirect() {
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      router.replace(`/personal-${session.user.id}`);
    }
  }, [session?.user?.id, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)]">
      <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
    </div>
  );
}
