"use client";

import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { AuditLogViewer } from "@/components/dashboard/AuditLogViewer";

export default function AuditLogPage() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";
  const currentOrg = useOrgStore((s) => s.currentOrg)();
  const hasPermission = useOrgStore((s) => s.hasPermission);

  if (!currentOrg) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  if (!hasPermission("manageOrg")) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Audit Log
        </h1>
        <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            You don&apos;t have permission to view the audit log.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Audit Log
      </h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Activity history for your organisation
      </p>
      <div className="mt-6">
        <AuditLogViewer orgSlug={orgSlug} orgId={currentOrg.id} />
      </div>
    </div>
  );
}
