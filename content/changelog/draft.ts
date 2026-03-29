import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * Run `npm run changelog:publish` to move these to published.ts.
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [
  {
    id: "2026-w13-changelog-system",
    title: "Weekly changelog",
    description:
      "New changelog page with product filtering across Studio, CLI, Figma Plugin, and Chrome Extension. Updated weekly.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-admin-changelog",
    title: "Changelog management in admin",
    description:
      "Preview, add, edit, and remove changelog entries directly from the admin panel. Publish the week's updates with one click.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-icon-packs",
    title: "Icon pack selection for design systems",
    description:
      "Choose from 6 open source icon libraries (Lucide, Heroicons, Phosphor, Tabler, Radix, Simple Icons) in the new Icons tab. Selected packs are added to your layout.md and used by AI when generating variants.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-token-colour-swatches",
    title: "Token colour swatches now show actual colours",
    description:
      "Colour tokens using CSS variable references (like var(--primary)) now display their resolved colour instead of showing a black circle.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-token-subgroups",
    title: "Collapsible token sub-groups",
    description:
      "Token categories like Surfaces, Text, and Borders can now be collapsed and expanded independently, making it easier to navigate large design systems.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-structure-first-images",
    title: "Structure-first design exploration",
    description:
      "Variants now generate instantly with styled placeholders instead of waiting for all images. See your page structure immediately, then generate images one at a time or in bulk when you're ready.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-inspector-image-tab",
    title: "Generate images from the Inspector",
    description:
      "Click any image placeholder in Inspector to see its prompt, edit it, choose a style and aspect ratio, then generate. Images save to the variant immediately and persist when you exit Inspector.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-smart-regenerate",
    title: "Smart image regeneration",
    description:
      "The Generate Images button now only creates missing images by default, keeping ones you've already generated. Shift+click to regenerate everything. Progress counter and Stop button included.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-real-brand-logos",
    title: "Real brand logos in designs",
    description:
      "Trust bars and logo grids now use real, recognisable brand logos from Simple Icons (3,400+ brands) instead of generic placeholder shapes. Logos render instantly without image generation.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-photorealistic-images",
    title: "Photorealistic image generation",
    description:
      "Generated headshots and photos are now explicitly photorealistic. If a prompt mentions illustration, cartoon, or sketch, the style is respected. Safety retries no longer switch to cartoon style.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-inspector-draggable",
    title: "Draggable and resizable Inspector panel",
    description:
      "The Inspector property panel can now be dragged to any position and resized by pulling the corner handle. Dropdown menus no longer get clipped.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-instant-style-edits",
    title: "Instant style edits in Inspector",
    description:
      "Changing font weight, colour, size, spacing, and other properties in the Inspector now applies instantly via direct code replacement. No more 30-second AI calls for simple changes.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-inspector-apply-fix",
    title: "Inspector changes no longer hang or get lost",
    description:
      "Fixed the 'Applying changes...' spinner that would hang indefinitely. Style edits now show elapsed time, display errors clearly, and pending changes are preserved when switching between elements.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-design-system-compliance",
    title: "Stronger design system compliance",
    description:
      "Variants now strictly follow your design system's button radius, fonts, colours, and spacing. Added self-check instructions that catch common violations like wrong border-radius or invented brand names.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-tablet-nav-fix",
    title: "Better tablet navigation",
    description:
      "Navigation menus now use the hamburger menu on tablet (768px) as well as mobile. Full horizontal nav only appears at desktop width (1024px+) where there's enough room.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-gemini-error-surfacing",
    title: "Gemini generation errors now visible",
    description:
      "When Gemini fails to generate a variant (token limit, content policy, API error), you now see the actual error message instead of the generation silently stopping.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-free-credits-init",
    title: "Free credits work on first sign-up",
    description:
      "New accounts now correctly receive their free monthly credits (2 layout.md extractions + 5 AI queries) immediately. Previously the billing page showed 0 credits until the first generation attempt.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-better-error-messages",
    title: "Clearer error messages when generation fails",
    description:
      "When layout.md generation fails due to missing credits or API key issues, you now see a helpful message pointing you to Settings to add your own Anthropic API key.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
];
