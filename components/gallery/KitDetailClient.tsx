"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  kitId: string;
  isLoggedIn: boolean;
  currentOrgSlug?: string;
}

export function KitDetailImportButton({ slug, isLoggedIn, currentOrgSlug }: Props) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/gallery/${slug}`);
      return;
    }
    if (!currentOrgSlug) {
      setError("Pick an organisation in Studio before importing");
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${currentOrgSlug}/kits/${slug}/import`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Import failed" }));
        throw new Error(body.error ?? "Import failed");
      }
      const { projectId } = (await res.json()) as { projectId: string };
      router.push(`/${currentOrgSlug}/projects/${projectId}/studio`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleImport}
        disabled={importing}
        className="px-5 py-2.5 rounded-full bg-[var(--mkt-accent)] text-[#08090a] text-[14px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {importing ? "Importing..." : isLoggedIn ? "Import to Studio" : "Log in to import"}
      </button>
      {error && <p className="text-[13px] text-red-400">{error}</p>}
      <Link
        href={`/api/public/kits/${slug}/download?tier=minimal`}
        className="text-center px-5 py-2.5 rounded-full border border-[var(--mkt-border)] text-[14px] text-[var(--mkt-text-primary)] hover:bg-white/5 transition-colors"
      >
        Download .zip
      </Link>
    </div>
  );
}
