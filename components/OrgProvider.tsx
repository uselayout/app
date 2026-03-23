"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useOrgStore } from "@/lib/store/organization";
import { useProjectStore } from "@/lib/store/project";
import type { Organization, OrgMember } from "@/lib/types/organization";
import type { Project } from "@/lib/types";

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

  const loadProjects = useProjectStore((s) => s.loadProjects);
  const clearProjects = useProjectStore((s) => s.clearProjects);
  const setHydrating = useProjectStore((s) => s.setHydrating);
  const setHydrationError = useProjectStore((s) => s.setHydrationError);

  // Fetch organisations when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      clear();
      clearProjects();
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
  }, [session?.user?.id, loadOrganizations, clear, clearProjects]);

  // Resolve org slug to current org + fetch membership, members, AND projects in parallel
  useEffect(() => {
    if (!session?.user?.id || organizations.length === 0) return;

    const userId = session.user.id;
    const org = orgSlug
      ? organizations.find((o) => o.slug === orgSlug)
      : organizations.find((o) => o.slug.startsWith("personal-")) ??
        organizations[0] ??
        null;

    if (!org) {
      setCurrentOrg(null);
      setCurrentMembership(null);
      setMembers([]);
      clearProjects();
      return;
    }

    setCurrentOrg(org.id);

    // Fire all three fetches in parallel
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

    // Projects — previously waited for currentOrgId to propagate to ProjectHydrator
    setHydrating(true);
    fetch(`/api/organizations/${org.id}/projects`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
        return res.json() as Promise<Project[]>;
      })
      .then((projects) => loadProjects(projects, userId, org.id))
      .catch((err: unknown) => {
        console.error("Failed to hydrate projects:", err);
        setHydrating(false);
        setHydrationError("Failed to load projects. Please refresh the page.");
      });
  }, [
    session?.user?.id,
    orgSlug,
    organizations,
    setCurrentOrg,
    setCurrentMembership,
    setMembers,
    loadProjects,
    clearProjects,
    setHydrating,
    setHydrationError,
  ]);

  return <>{children}</>;
}
