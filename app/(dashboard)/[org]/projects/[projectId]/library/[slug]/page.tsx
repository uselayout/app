"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useOrgStore } from "@/lib/store/organization";
import { ComponentDetail } from "@/components/dashboard/ComponentDetail";
import type { Component } from "@/lib/types/component";

export default function ComponentDetailPage() {
  const params = useParams();
  const orgSlug = (params?.org as string) ?? "";
  const slug = (params?.slug as string) ?? "";
  const orgId = useOrgStore((s) => s.currentOrgId);

  const [component, setComponent] = useState<Component | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !slug) return;

    let cancelled = false;

    async function fetchComponent() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/organizations/${orgId}/components?search=${encodeURIComponent(slug)}`
        );
        if (!res.ok) {
          setError("Failed to load component");
          return;
        }

        const components: Component[] = await res.json();
        const match = components.find((c) => c.slug === slug);

        if (!cancelled) {
          if (match) {
            setComponent(match);
          } else {
            setError("Component not found");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchComponent();
    return () => {
      cancelled = true;
    };
  }, [orgId, slug]);

  const handleUpdate = useCallback((updated: Component) => {
    setComponent(updated);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-[var(--text-muted)]">
          {error ?? "Component not found"}
        </p>
      </div>
    );
  }

  return (
    <ComponentDetail
      component={component}
      orgSlug={orgSlug}
      onUpdate={handleUpdate}
    />
  );
}
