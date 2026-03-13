import type { Metadata } from "next";
import { StudioIndexClient } from "@/components/studio/StudioIndexClient";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Layout Studio — extract and generate design system context.",
};

export default function StudioIndexPage() {
  return <StudioIndexClient />;
}
