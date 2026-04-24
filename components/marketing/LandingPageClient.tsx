"use client";

import { useState } from "react";
import { AnnouncementBanner } from "@/components/marketing/AnnouncementBanner";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { HeroSection } from "@/components/marketing/HeroSection";
import { ContextGapSection } from "@/components/marketing/ContextGapSection";
import { ExtractSection } from "@/components/marketing/ExtractSection";
import { CompletenessSection } from "@/components/marketing/CompletenessSection";
import { ServeSection } from "@/components/marketing/ServeSection";
import { FigmaLoopSection } from "@/components/marketing/FigmaLoopSection";
import { ExtensionSection } from "@/components/marketing/ExtensionSection";
import { ExplorerSection } from "@/components/marketing/ExplorerSection";
import { DesignSystemSection } from "@/components/marketing/DesignSystemSection";
import { BrowseKitsCTA } from "@/components/marketing/BrowseKitsCTA";
import { ComparisonSection } from "@/components/marketing/ComparisonSection";
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
          <HeroSection onInstallCLI={openInstall} />
          <ContextGapSection />
          <ExtractSection />
          <CompletenessSection />
          <ServeSection />
          <FigmaLoopSection />
          <ExtensionSection />
          <ExplorerSection />
          <DesignSystemSection />
          <BrowseKitsCTA />
          <ComparisonSection />
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
