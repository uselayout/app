import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The layout.md specification | Layout",
  description:
    "Canonical specification for the layout.md format. Structured, LLM-optimised context bundles that compile a design system down to what AI coding agents need: tokens, typography, components, and anti-patterns.",
};

// /spec is the canonical, shareable URL for the format specification.
// The full content lives at /docs/layout-md to stay in the docs navigation.
export default function SpecPage() {
  redirect("/docs/layout-md");
}
