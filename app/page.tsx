import type { Metadata } from "next";
import { LandingPageClient } from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "Layout — The compiler between design systems and AI coding agents",
  description:
    "Extract design systems from Figma and websites. Generate LLM-optimised context bundles that help AI coding agents produce on-brand UI code consistently.",
};

export default function LandingPage() {
  return <LandingPageClient />;
}
