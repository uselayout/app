import type { ChangelogEntry } from "@/lib/types/changelog";

/**
 * Draft entries for the current week.
 * After adding entries, run: npx tsx scripts/add-changelog.ts
 *
 * Write titles and descriptions for users, not developers.
 * Good: "Faster Figma extraction" / "Design tokens now extract 3x faster from large Figma files."
 * Bad:  "perf: optimise batch node fetching"
 */
export const draftEntries: ChangelogEntry[] = [
  {
    id: "2026-w17-welcome-modal-remove-video-link",
    title: "Welcome modal no longer links to an unrecorded video",
    description:
      "The \"Watch a 90-second overview\" link in the welcome modal pointed at our YouTube channel before the overview video existed. Removed for now; it'll come back once the video is ready to watch.",
    product: "studio",
    category: "fixed",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-inspector-brand-asset-picker",
    title: "Swap brand logos from the Inspector",
    description:
      "When the AI picks the wrong logo variant (white on light, colour on dark, icon when you wanted a wordmark), you no longer have to regenerate the whole variant. Click the logo in Inspect mode and a new Logo tab lets you swap to any of your uploaded brand assets. The preview updates instantly and the change is written back to the variant's code on Apply.",
    product: "studio",
    category: "new",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-settings-sidebar-cleanup",
    title: "Cleaner sidebar on settings pages",
    description:
      "The left navigation used to show Editor, Explore, Design System and Library on settings pages where none of them worked. Those items now hide whenever you're not inside a project, so the sidebar only shows what you can actually click.",
    product: "studio",
    category: "fixed",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-onboarding-cli-link-and-persist",
    title: "Install CLI step now links to instructions",
    description:
      "The \"Install the CLI\" item in the onboarding checklist now has an Open instructions link, matching the Figma plugin and Chrome extension steps. Install instruction links also stay visible after you tick a step done, so you can come back to them later without rerunning onboarding.",
    product: "studio",
    category: "improved",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-push-to-figma-catalog-link",
    title: "Push to Figma: working link to Figma's MCP catalog",
    description:
      "The \"Figma MCP server\" link in the Push to Figma modal used to go to a page that no longer loads. It now points to Figma's MCP catalog so you can actually get the Figma MCP set up in one click.",
    product: "studio",
    category: "fixed",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-push-to-figma-friendlier-copy",
    title: "Friendlier Push to Figma modal",
    description:
      "Rewritten prerequisites and steps to focus on what happens for you (\"your design appears in Figma, ready to edit\") rather than what happens under the hood. Added direct links to the setup guide and Figma MCP catalog so first-timers have a clear next step.",
    product: "studio",
    category: "improved",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-onboarding-byok-framing",
    title: "Onboarding keys are now clearly optional",
    description:
      "The Anthropic key row in the checklist read like a required step, but variants run on Layout's hosted model by default — your own key is only needed if you'd rather swap it in. Relabelled as \"Bring your own keys (optional)\" and clarified that the Figma token and Gemini key only matter if you want Figma import/push or AI image generation.",
    product: "studio",
    category: "improved",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-explorer-brand-logos-render",
    title: "Explorer variants now show your uploaded brand logos",
    description:
      "Generated components that referenced your brand logo (footers, headers, sign-up cards) were rendering a broken image where the logo should be. The src was either getting dropped on the final write, or written as a relative URL that sandboxed preview frames couldn't load. Logos now survive the full pipeline and render correctly in grid cards, the Inspector and the responsive preview modal.",
    product: "studio",
    category: "fixed",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-extraction-diff-scrolls",
    title: "Extraction Changes modal now scrolls through every change",
    description:
      "When a re-extraction produced a long list of token or component changes, the review dialog clipped the bottom rows with no way to scroll. The list now scrolls properly so you can review and accept changes no matter how many there are.",
    product: "studio",
    category: "fixed",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-session-stickiness",
    title: "Staging sessions stick around properly",
    description:
      "If your staging session got bounced back to login we now tell you why — and when it's a real server-side problem (not just an expired cookie) the cause is logged so we can fix it rather than guess. Paired with tighter auth config to make session behaviour identical across environments.",
    product: "studio",
    category: "fixed",
    date: "2026-04-22",
  },
  {
    id: "2026-w17-preserve-curation-on-reextract",
    title: "Re-extraction no longer wipes your hand-curated assignments",
    description:
      "If you'd assigned a specific token to a role (e.g. picked your real brand hover instead of the auto-matched one), re-extracting used to silently reset it back to whatever the auto matcher preferred. Those hand-picked assignments now survive re-extraction — only roles you never touched get re-matched.",
    product: "studio",
    category: "fixed",
    date: "2026-04-22",
  },
  {
    id: "2026-w17-curated-standardisation-after-synthesis",
    title: "Curated view now maps the full synthesised token set",
    description:
      "On websites where most tokens are synthesised during extraction rather than read from the raw stylesheet (Coinbase, Stripe, Linear and similar), the Curated page was mapping only a single accent token — the matcher ran before the synthesised tokens were merged in. The matcher now runs a second time after synthesis, so all background, text, border and accent roles auto-fill the way they should.",
    product: "studio",
    category: "fixed",
    date: "2026-04-22",
  },
  {
    id: "2026-w17-explorer-reference-images-persist",
    title: "Explorer reference images now persist across refreshes",
    description:
      "Images dropped or pasted into an Explorer tab — and screenshots pushed from the Chrome extension — are now saved to project storage and reload correctly after a refresh. Previously, large images were silently dropped from the save payload.",
    product: "studio",
    category: "fixed",
    date: "2026-04-21",
  },
  {
    id: "2026-w17-accent-hover-hue-match",
    title: "Accent hover colour stays on-brand",
    description:
      "The Design System page now prefers a hover colour in the same hue family as your accent. If your extraction doesn't ship a matching hover tone, the slot is left empty for you to fill rather than picking an off-brand match.",
    product: "studio",
    category: "improved",
    date: "2026-04-21",
  },
  {
    id: "2026-w17-curated-dark-mode",
    title: "Curate light and dark tokens side by side",
    description:
      "The Design System page now has a mode toggle when your project includes both light and dark tokens. Switch between modes to assign different colours to the same role, and use \"Copy from Light\" to bootstrap dark from your existing light assignments. Exports and the AI-facing layout.md now carry per-mode data automatically.",
    product: "studio",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-screenshot-push-crash",
    title: "Screenshot push no longer crashes the Studio page",
    description:
      "Pushing a screenshot from the Chrome extension to a project whose layout.md hadn't been generated yet could put the Studio page into a render loop and show the \"Something went wrong\" screen. The auto-generate retry now waits for an explicit refresh instead of firing on every re-render.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-welcome-onboarding",
    title: "Welcome modal and onboarding checklist",
    description:
      "New accounts now open to a welcome modal with a step-by-step setup checklist covering API keys, extraction, variant generation, saving components, and installing the CLI, Figma plugin and Chrome extension. Progress persists in a compact card tucked above your profile in the sidebar, stays clickable after you close the modal, and quietly disappears when everything is wired up.",
    product: "studio",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w16-surgical-layout-edits",
    title: "AI chat edits layout.md surgically",
    description:
      "The editor chat no longer rewrites your entire layout.md when you ask for a small change. The AI now returns just the lines that need to change and they're applied in place, so untouched sections stay byte-identical and the \"Writing... 100 lines\" full-file rewrite is gone.",
    product: "studio",
    category: "fixed",
    date: "2026-04-19",
  },
  {
    id: "2026-w16-start-blank",
    title: "Start with a blank design system",
    description:
      "New projects no longer need a Figma file or live website. Pick \"Start blank\" in the New Project modal to get an empty kit with standard section headings, then add tokens, branding, and context from the Source Panel as you go.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-branding-assets",
    title: "Upload brand logos and favicons",
    description:
      "Add your project's real logos, wordmarks, and favicons in a new Branding tab. AI-generated variants reference them via data-brand-logo attributes that resolve to your uploaded files, so mocks carry your actual identity rather than placeholder marks.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-context-docs",
    title: "Attach project context documents",
    description:
      "Upload brand voice docs, copy guidelines, or product descriptions in the new Context tab. Every variant generation includes them alongside your design tokens automatically. Claude treats tokens as truth and context docs as wording and tone input.",
    product: "studio",
    category: "new",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-fresh-layout-md",
    title: "Layout.md edits always reach AI generation",
    description:
      "Editing layout.md in Monaco and immediately clicking Generate no longer races saves. The explore route fetches the latest saved copy server-side before building the prompt. A new banner also surfaces when a manual layout.md section drifts from your extracted tokens.",
    product: "studio",
    category: "fixed",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-add-tokens",
    title: "Add tokens manually",
    description:
      "Missed a colour, spacing, or radius value during extraction? Click the new + button in the Source Panel or Design System page to add tokens directly. New tokens sync to layout.md and export bundles automatically.",
    product: "studio",
    category: "new",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-custom-hex-persistence",
    title: "Custom colours now persist",
    description:
      "When you enter a custom hex in the Design System role assignment popover, the token is now saved to your design system. Previously, custom colours were lost on refresh.",
    product: "studio",
    category: "fixed",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-token-delete-sync",
    title: "Deleting tokens updates layout.md",
    description:
      "Removing a token from the Source Panel or Design System page now removes it from layout.md too. No more stale token references for AI agents to trip over.",
    product: "studio",
    category: "fixed",
    date: "2026-04-17",
  },
  {
    id: "2026-w16-theme-switching",
    title: "Light, dark, and system theme",
    description:
      "Switch between light mode, dark mode, or follow your system preference. The entire Studio UI adapts, including modals, dropdowns, and variant previews.",
    product: "studio",
    category: "new",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-forgot-password",
    title: "Forgot password flow",
    description:
      "Reset your password via email if you forget it. Click 'Forgot password?' on the login page to receive a reset link.",
    product: "studio",
    category: "new",
    date: "2026-04-10",
  },
  {
    id: "2026-w16-workspace-switcher",
    title: "Improved workspace switcher",
    description:
      "The sidebar workspace switcher now shows your organisation and project name stacked for clarity. Create new projects directly from the switcher dropdown.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-design-system-page-improvements",
    title: "Better Design System page",
    description:
      "Token categorisation, grouping, and previews are now more accurate. Spacing and effect tokens display correctly, and the view is preserved when switching projects.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-image-generation-reliability",
    title: "More reliable AI image generation",
    description:
      "Fixed several issues where generated images would show broken URLs or disappear on re-generation. Avatar placeholders and batch image generation now work reliably.",
    product: "studio",
    category: "fixed",
    date: "2026-04-13",
  },
  {
    id: "2026-w16-inspector-fixes",
    title: "Inspector style edits now target the correct element",
    description:
      "Fixed an issue where Inspector edits could apply styles to the wrong element. Edits now reliably target exactly what you selected.",
    product: "studio",
    category: "fixed",
    date: "2026-04-13",
  },
  {
    id: "2026-w16-extraction-css-fix",
    title: "Cleaner CSS token injection",
    description:
      "Extracted design tokens no longer conflict with existing styles in variant previews. Malformed CSS variable names from extractions are now filtered out automatically.",
    product: "studio",
    category: "fixed",
    date: "2026-04-08",
  },
  {
    id: "2026-w16-variant-feedback",
    title: "Rate generated variants",
    description:
      "Thumbs up or down on generated variants to help improve future results. Feedback is logged and visible in the admin dashboard.",
    product: "studio",
    category: "new",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-cancel-extraction",
    title: "Cancel extractions in progress",
    description:
      "Long-running Figma or website extractions can now be cancelled mid-way instead of waiting for them to complete.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w16-preview-hooks-fix",
    title: "Fixed React component previews",
    description:
      "Components using React hooks (useState, useEffect, etc.) now render correctly in variant previews instead of showing errors.",
    product: "studio",
    category: "fixed",
    date: "2026-04-09",
  },
  {
    id: "2026-w16-light-mode-polish",
    title: "Light mode polish",
    description:
      "Improved contrast, softer modal overlays, and consistent colours across the entire UI in light mode.",
    product: "studio",
    category: "improved",
    date: "2026-04-12",
  },
  {
    id: "2026-w17-curated-tokens-reach-ai",
    title: "Curated tokens reliably reach your AI agents",
    description:
      "Curating a role like APP BACKGROUND to pure white used to leave stale tokens in layout.md's Core Tokens block, so AI agents kept generating off-brand UI. Every MCP, Explorer, and export read now regenerates that block from your curated assignments, so what Claude sees always matches what you chose.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-curated-count-label",
    title: "Clearer role count on the Curated page",
    description:
      "Section headers now read \"BACKGROUNDS 3 of 6 roles\" instead of the cryptic \"BACKGROUNDS 3 3/6\". Same data, no maths required.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-icon-packs-persist",
    title: "Selected icon packs now persist",
    description:
      "Picking icon packs in the Source Panel worked in the session but disappeared on reload. Selections now save to the server and come back when you return to the project.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-snapshots-persist",
    title: "Design system snapshots survive reloads",
    description:
      "Snapshots taken from the Curated view used to live only in your current browser session and vanished on refresh. They are now stored server-side, so rollbacks work after closing the tab or coming back the next day.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-exported-layout-matches",
    title: "Exported layout.md matches what your agents see",
    description:
      "The layout.md in exported ZIPs is now the exact document MCP and the Explorer read, with curated Core Tokens and the full token reference appendix regenerated from your latest design system. No more drift between what you exported to Cursor or Windsurf and what the Explorer used for variants.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-explorer-avatar-reliability",
    title: "Avatar generation in Explorer variants is reliable again",
    description:
      "Dynamic avatars and contextual images in generated variants used to fail in subtle ways — the same face repeated for every member of a team list, images vanishing entirely when the component used a helper function, or broken-image icons showing when generation hit a quota. Variants now always render either the correct image or a clear placeholder, and list templates produce per-item variety the way they look in the code.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-explorer-avatar-names",
    title: "Avatar placeholders for non-Latin names and repeated initials",
    description:
      "Avatar placeholder circles containing non-Latin names like 李明, accented characters like Éliane, or longer first names like Santiago now generate portrait images automatically. Two team members sharing initials (two AAs for Alex Adams and Amy Anderson) now get distinct faces instead of the same person appearing twice.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-explorer-context-file-errors",
    title: "Clearer errors when context files are too large",
    description:
      "Uploading an oversized context file to the Explorer now returns a message naming the file and its size (\"Context file brand-voice.md is 82KB. Each file must be ≤ 50KB.\") instead of a generic validation error. The 3-file cap surfaces its own friendly message too.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-orphan-sections-feed-ai",
    title: "Brand assets, icons, context docs and scanned components now feed your AI",
    description:
      "Uploading brand logos, picking icon packs, attaching product-context documents, or scanning your codebase for components previously stored the data but never sent it to AI coding agents. All four now emit their own sections in your layout.md (Brand Assets, Icons, Component Inventory, Product Context), so MCP and the Explorer have access to the full context every time they generate.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-dark-mode-end-to-end",
    title: "Dark mode works end-to-end in curated tokens",
    description:
      "Extracting a site with dark-mode tokens now flows cleanly through curation and into your design system exports. Assignments can carry a mode tag, the derived layout.md emits :root and [data-theme=\"dark\"] blocks (plus a prefers-color-scheme: dark twin), the exported tokens.json tags mode-scoped entries, and the Tailwind config picks up darkMode: [\"selector\", '[data-theme=\"dark\"]'] automatically when any mode variants exist.",
    product: "studio",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-auth-modal-dark",
    title: "Sign-in and password modals stay dark in light mode",
    description:
      "The sign-in, sign-up, forgot-password, password-reset and request-access modals now render dark regardless of your Studio theme preference. Previously the modal card turned white against the dark aurora page when the Studio was in light mode, breaking the marketing aesthetic.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-unified-token-taxonomy",
    title: "Consistent token category names across Source Panel and Curated",
    description:
      "Raw-token groupings in the Source Panel and Design System \"All Tokens\" view used to read \"Brand / Surfaces / Interactive\" while the Curated view used \"Accent / Backgrounds\". Same concept, two vocabularies. Now both surfaces use the same taxonomy: Backgrounds, Text, Borders, Accent, Status, Primitives, Palette, Components.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-monaco-derived-lock",
    title: "Editor protects AI-generated sections of layout.md",
    description:
      "Sections that the system regenerates on every read (Core Tokens, Appendix A, Brand Assets, Icons, Component Inventory, Product Context) are now visually distinct in the Editor with a striped gutter and subtle background. Typing inside one is reverted with a toast pointing you to the right tab to edit that content — so you never lose work to a silent regeneration again.",
    product: "studio",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-authored-prose-split",
    title: "Existing projects auto-migrate to the authored-prose model",
    description:
      "Projects loaded after this release automatically split their layout.md into authored prose (what you wrote) and derived content (what the system generates). Nothing changes on screen, but the system now has a cleaner foundation to keep your prose intact when it regenerates the derived parts.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-design-system-hub",
    title: "Design System page consolidates tokens, assets and context",
    description:
      "The Design System page now has Tokens, Assets and Context sub-tabs. Design tokens, icon packs, fonts, brand logos and product-context documents all live in one place instead of scattered across separate sidebar tabs. The Editor stays where it is in the sidebar.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-brand-cta-accent",
    title: "Brand CTA colours now assigned to the Accent role",
    description:
      "Extracting a site whose primary brand colour lives in tokens named like --color-cta-primary-bg used to leave the Accent role empty — the matcher picked a blue link colour over the actual brand green. The matcher is now weighted so CTA, brand and primary tokens outrank interactive and link tokens for the Accent role. On-accent text and hover variants get their matching CTA counterparts too.",
    product: "studio",
    category: "fixed",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-appendix-base64-elide",
    title: "Design system exports no longer carry base64 image data",
    description:
      "Some sites define tokens whose value is a large base64-encoded image data URI. These used to land verbatim in your layout.md's Appendix A, bloating the file and eating AI context window for zero useful signal. Big data URIs are now replaced with a size marker so the AI still sees that a token is an image but doesn't carry the payload.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-branding-card-redesign",
    title: "Tidier Brand Assets list",
    description:
      "Brand asset cards in the Design System used to stretch two full-width dropdowns per asset, so even a handful of uploaded logos filled the viewport. Cards now use a single row with a small thumbnail, filename + size inline, compact slot and variant selectors, and a delete action on the right.",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-derived-editor-polish",
    title: "Clearer language on auto-generated sections of layout.md",
    description:
      "The Editor used to stamp auto-generated sections (Core Tokens, Appendix A, Brand Assets, etc.) with a dashed yellow/purple stripe and a lock emoji, with toast copy like 'is regenerated from project state'. Now a subtle boundary bar marks the range and the toast reads 'Core Tokens is built from your design system — typing here won't stick. Open the Tokens tab to edit it.'",
    product: "studio",
    category: "improved",
    date: "2026-04-20",
  },
];
