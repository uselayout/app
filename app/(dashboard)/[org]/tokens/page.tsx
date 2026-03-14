"use client";

import { useState, useEffect } from "react";
import { useOrgStore } from "@/lib/store/organization";
import { TokenEditor } from "@/components/dashboard/TokenEditor";
import type { DesignToken, DesignTokenType } from "@/lib/types/token";

export default function TokensPage() {
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [tokens, setTokens] = useState<DesignToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DesignTokenType>("color");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!orgId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organizations/${orgId}/tokens?type=${selectedType}`
        );
        if (!cancelled && res.ok) {
          const data: DesignToken[] = await res.json();
          setTokens(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orgId, selectedType, refreshKey]);

  function handleTokensChange() {
    setRefreshKey((k) => k + 1);
  }

  if (!orgId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading organisation...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Tokens
          </h1>
          {!loading && (
            <span className="text-sm text-[var(--text-muted)]">
              {tokens.length} token{tokens.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      ) : (
        <TokenEditor
          orgId={orgId}
          tokens={tokens}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onTokensChange={handleTokensChange}
        />
      )}
    </div>
  );
}
