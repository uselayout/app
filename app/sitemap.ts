import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://layout.design";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/docs`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/docs/walkthrough`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/docs/studio`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/docs/cli`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/docs/integrations/claude-code`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs/integrations/cursor`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs/integrations/copilot`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs/integrations/windsurf`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs/integrations/codex`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/docs/api-reference`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/docs/design-md`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/docs/self-hosting`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
}
