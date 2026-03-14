"use client";

import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { ApiKeyManager } from "@/components/dashboard/ApiKeyManager";

export default function ApiKeysPage() {
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

  if (!hasPermission("manageApiKeys")) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          API Keys
        </h1>
        <div className="mt-6 rounded-lg border border-[var(--studio-border)] bg-[var(--bg-surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-secondary)]">
            You don&apos;t have permission to manage API keys.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-1">
        <a
          href={`/${orgSlug}/settings`}
          className="text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          &larr; Settings
        </a>
      </div>
      <ApiKeyManager orgId={currentOrg.id} />
    </div>
  );
}
