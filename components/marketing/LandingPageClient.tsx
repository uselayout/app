"use client";

import { useState } from "react";
import { AnnouncementBanner } from "@/components/marketing/AnnouncementBanner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ContextGapSection } from "@/components/marketing/ContextGapSection";
import { LayoutLiveSection } from "@/components/marketing/LayoutLiveSection";
import { TeamsSection } from "@/components/marketing/TeamsSection";
import { PipelineSection } from "@/components/marketing/PipelineSection";
import { FigmaSyncSection } from "@/components/marketing/FigmaSyncSection";
import { EcosystemSection } from "@/components/marketing/EcosystemSection";
import { OpenSourceSection } from "@/components/marketing/OpenSourceSection";
import { EarlyAccessCTA } from "@/components/marketing/EarlyAccessCTA";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { InstallCLIModal } from "@/components/marketing/InstallCLIModal";

export function LandingPageClient() {
  const [showInstallModal, setShowInstallModal] = useState(false);

  const openInstall = () => setShowInstallModal(true);

  return (
    <div className="dark">
      {/* Main content layers above sticky footer for reveal effect */}
      <div className="relative z-10 bg-[var(--mkt-bg)]">
        <AnnouncementBanner />
        <MarketingHeader />
        <main>
          {/* Narrative: problem → Live (lead product) → teams (buy trigger)
              → pipeline → Figma sync → everything else, compressed. */}
          <HeroSection onInstallCLI={openInstall} />
          <ContextGapSection />
          <LayoutLiveSection />
          <TeamsSection />
          <PipelineSection />
          <FigmaSyncSection />
          <EcosystemSection />
          <OpenSourceSection />
          <EarlyAccessCTA onInstallCLI={openInstall} />
        </main>
      </div>
      {/* Footer is sticky bottom-0 z-0, revealed as content scrolls away */}
      <MarketingFooter />

      {showInstallModal && (
        <InstallCLIModal onClose={() => setShowInstallModal(false)} />
      )}
    </div>
  );
}
