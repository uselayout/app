import type { Metadata } from "next";
import { LandingPageClient } from "@/components/marketing/LandingPageClient";

export const metadata: Metadata = {
  title: "Layout — Your design system, enforced in every AI agent",
  description:
    "Extract your design system from Figma or any live website, serve it to Claude Code, Cursor, Copilot and Codex, and gate every AI edit to your tokens. Unmetered, agent-agnostic, open source.",
};

export default function LandingPage() {
  return <LandingPageClient />;
}
