"use client";

import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { TypographyEditor } from "@/components/dashboard/TypographyEditor";

export default function TypographyPage() {
  const currentOrg = useOrgStore((s) => s.currentOrg)();
  const params = useParams<{ org: string; projectId: string }>();

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Typography
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage typefaces and type scale for your design system
        </p>
      </div>

      <TypographyEditor orgId={currentOrg.id} studioUrl={`/${params.org}/projects/${params.projectId}/studio`} />
    </div>
  );
}
