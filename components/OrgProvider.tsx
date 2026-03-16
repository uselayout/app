"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useOrgStore } from "@/lib/store/organization";
import type { Organization, OrgMember } from "@/lib/types/organization";

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : null;

  const loadOrganizations = useOrgStore((s) => s.loadOrganizations);
  const setCurrentOrg = useOrgStore((s) => s.setCurrentOrg);
  const setCurrentMembership = useOrgStore(
    (s) => s.setCurrentMembership
  );
  const setMembers = useOrgStore((s) => s.setMembers);
  const organizations = useOrgStore((s) => s.organizations);
  const clear = useOrgStore((s) => s.clear);

  // Fetch organisations when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      clear();
      return;
    }

    fetch("/api/organizations")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch organisations");
        return res.json() as Promise<Organization[]>;
      })
      .then((orgs) => loadOrganizations(orgs))
      .catch((err: unknown) => {
        console.error("Failed to load organisations:", err);
      });
  }, [session?.user?.id, loadOrganizations, clear]);

  // Resolve org slug to current org + fetch membership and members
  useEffect(() => {
    if (!session?.user?.id || organizations.length === 0) return;

    const org = orgSlug
      ? organizations.find((o) => o.slug === orgSlug)
      : organizations.find((o) => o.slug.startsWith("personal-")) ??
        organizations[0] ??
        null;

    // Debug: remove after confirming push button works
    console.log("[OrgProvider]", { orgSlug, orgFound: org?.slug, orgId: org?.id, orgCount: organizations.length });

    if (!org) {
      setCurrentOrg(null);
      setCurrentMembership(null);
      setMembers([]);
      return;
    }

    setCurrentOrg(org.id);

    // Fetch current user's membership
    fetch(`/api/organizations/${org.id}/membership`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch membership");
        return res.json() as Promise<OrgMember>;
      })
      .then((member) => setCurrentMembership(member))
      .catch((err: unknown) => {
        console.error("Failed to load membership:", err);
        setCurrentMembership(null);
      });

    // Fetch all members
    fetch(`/api/organizations/${org.id}/members`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch members");
        return res.json() as Promise<OrgMember[]>;
      })
      .then((members) => setMembers(members))
      .catch((err: unknown) => {
        console.error("Failed to load members:", err);
        setMembers([]);
      });
  }, [
    session?.user?.id,
    orgSlug,
    organizations,
    setCurrentOrg,
    setCurrentMembership,
    setMembers,
  ]);

  return <>{children}</>;
}
