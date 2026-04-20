"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { CHECKLIST_VERSION, useOnboardingStore } from "@/lib/store/onboarding";
import { useProjectStore } from "@/lib/store/project";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

export function OnboardingShell() {
  const params = useParams();
  const orgSlug = typeof params?.org === "string" ? params.org : "";

  const _hasHydrated = useOnboardingStore((s) => s._hasHydrated);
  const dismissed = useOnboardingStore((s) => s.dismissed);
  const lastSeenVersion = useOnboardingStore((s) => s.lastSeenVersion);
  const steps = useOnboardingStore((s) => s.steps);
  const openModal = useOnboardingStore((s) => s.openModal);
  const setLastSeenVersion = useOnboardingStore((s) => s.setLastSeenVersion);

  const firstProjectId = useProjectStore((s) => s.projects[0]?.id);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (dismissed) return;
    if (lastSeenVersion >= CHECKLIST_VERSION) return;

    const untouched = Object.values(steps).every((v) => v === false);
    if (untouched) {
      openModal();
    }
    setLastSeenVersion(CHECKLIST_VERSION);
  }, [_hasHydrated, dismissed, lastSeenVersion, steps, openModal, setLastSeenVersion]);

  if (!orgSlug) return null;

  return <WelcomeModal firstProjectId={firstProjectId} orgSlug={orgSlug} />;
}
