"use client";

import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { TemplatePublisher } from "@/components/dashboard/TemplatePublisher";

export default function TemplateSettingsPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const currentOrg = useOrgStore((s) => s.currentOrg)();
  const hasPermission = useOrgStore((s) => s.hasPermission);

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  if (!hasPermission("manageOrg")) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Templates
        </h1>
        <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            You don&apos;t have permission to manage templates. Only
            organisation owners can publish templates.
          </p>
        </div>
      </div>
    );
  }

  return <TemplatePublisher orgId={currentOrg.id} orgSlug={orgSlug} />;
}
