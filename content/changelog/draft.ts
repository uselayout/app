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
    id: "2026-w14-admin-email-broadcast",
    title: "Admin email broadcast",
    description:
      "Send broadcast emails to all users or specific segments directly from the admin panel. Write in plain text with basic formatting support and preview the styled email before sending.",
    product: "studio",
    category: "new",
    date: "2026-04-01",
  },
  {
    id: "2026-w14-large-site-reliability",
    title: "More reliable generation for large websites",
    description:
      "Fixed an issue where layout.md generation could hang indefinitely on large or complex websites. Generation now completes reliably, with better progress indication and automatic recovery if the connection stalls.",
    product: "studio",
    category: "fixed",
    date: "2026-04-01",
  },
  {
    id: "2026-w14-retry-generation-errors",
    title: "Smarter error handling for design system generation",
    description:
      "If our AI service is temporarily at capacity, Layout now automatically retries a couple of times before showing an error. When generation does fail, you'll see a clear message instead of raw technical output, and your credit is refunded automatically.",
    product: "studio",
    category: "fixed",
    date: "2026-03-31",
  },
  {
    id: "2026-w14-admin-credit-topup",
    title: "Admin credit management",
    description:
      "Admins can now look up any user's credit balance and manually add top-up credits directly from the admin panel.",
    product: "studio",
    category: "new",
    date: "2026-03-31",
  },
  {
    id: "2026-w14-admin-email-dropdown",
    title: "Choose which email to send from admin",
    description:
      "When resending emails to approved users, you can now choose between resending the welcome email or sending a reminder. Previously only one option was shown at a time.",
    product: "studio",
    category: "improved",
    date: "2026-03-31",
  },
  {
    id: "2026-w14-admin-search",
    title: "Search access requests",
    description:
      "Quickly find users in the admin panel by searching by name or email. Filters instantly as you type.",
    product: "studio",
    category: "new",
    date: "2026-03-31",
  },
  {
    id: "2026-w14-admin-improvements",
    title: "Admin panel improvements",
    description:
      "Wider resizable 'What building' column, days-since-approval indicator, 'Signed up' filter, clearer stats, and ability to re-approve rejected users.",
    product: "studio",
    category: "improved",
    date: "2026-03-30",
  },
  {
    id: "2026-w13-security-hardening",
    title: "Security hardening",
    description:
      "Improved security practices for infrastructure credentials and repository hygiene.",
    product: "studio",
    category: "improved",
    date: "2026-03-30",
  },
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
  {
    id: "2026-w13-inspector-image-persist",
    title: "Inspector-generated images now save reliably",
    description:
      "Images generated via the Inspector now persist correctly when you exit Inspector mode. Previously, generated images would appear in the preview but disappear when switching back to the Explorer view.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-connect-tab-import-command",
    title: "Connect tab shows correct import command",
    description:
      "The CLI import command on the Connect tab now uses your project's actual filename instead of a wildcard pattern that could match multiple downloads.",
    product: "studio",
    category: "fixed",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-auto-sync-tokens",
    title: "Tokens appear automatically after extraction",
    description:
      "The token panel now populates immediately after layout.md generation completes. No more clicking Sync manually.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-credit-check-before-extract",
    title: "Credit check before extraction starts",
    description:
      "If you have no credits and no API key, you now see a clear message immediately instead of waiting 3-5 minutes for extraction to finish before failing.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-pat-auto-save",
    title: "Figma token saved to Settings automatically",
    description:
      "When you enter a Figma Personal Access Token during extraction, it is now saved to your API Keys settings so you do not need to re-enter it next time.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-design-system-overrides",
    title: "Override design system tokens in Explorer prompts",
    description:
      "You can now ask the AI to try specific style changes (e.g. 'use square buttons' or 'try serif fonts') and it will apply the override while keeping all other design system tokens intact.",
    product: "studio",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-primary-token-grouping",
    title: "Primary and secondary tokens grouped correctly",
    description:
      "Tokens like --color-primary, --color-secondary, and --color-tertiary now appear in their own 'Primary' group instead of being dumped into 'Other'.",
    product: "studio",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-plugin-health-check",
    title: "Figma plugin health check works again",
    description:
      "The Health Check feature in the Figma plugin now correctly authenticates with the Layout API. Previously it returned a 401 error after a recent auth update.",
    product: "figma-plugin",
    category: "fixed",
    date: "2026-03-29",
  },
  // --- CLI ---
  {
    id: "2026-w13-cli-6-targets",
    title: "Install to 6 AI coding tools",
    description:
      "The CLI now installs the Layout MCP server to VS Code/Copilot, Codex CLI, and Gemini CLI in addition to Claude Code, Cursor, and Windsurf.",
    product: "cli",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-cli-check-setup",
    title: "New check-setup tool and enhanced doctor",
    description:
      "AI agents can now run check-setup to verify their Layout configuration is working. The doctor command also gained richer diagnostics and a --fix flag for auto-repair.",
    product: "cli",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-cli-layout-md-rename",
    title: "DESIGN.md renamed to layout.md",
    description:
      "The design system file is now called layout.md. Existing projects are migrated automatically when you run any CLI command.",
    product: "cli",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-cli-multi-variant-push",
    title: "Push multiple variants to Figma",
    description:
      "push-to-figma now supports sending multiple component variants to Figma in a single operation.",
    product: "cli",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-cli-serve-local",
    title: "Local preview server",
    description:
      "New serve-local command starts a local preview server so you can see generated components in the browser before pushing to Figma.",
    product: "cli",
    category: "new",
    date: "2026-03-29",
  },
  // --- Figma Plugin ---
  {
    id: "2026-w13-figma-variables-panel",
    title: "Variables panel for token sync",
    description:
      "New Variables tab lets you sync design tokens between your layout.md and Figma variables. Tokens are organised into groups by category (colours, spacing, typography).",
    product: "figma-plugin",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-project-picker",
    title: "Project and org picker",
    description:
      "Switch between Layout projects and organisations directly from the plugin header. No more copying project IDs manually.",
    product: "figma-plugin",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-component-set",
    title: "Variant frames assembled into ComponentSets",
    description:
      "Pushed variants are now grouped into Figma ComponentSets with hover interactions, making them behave like native Figma components.",
    product: "figma-plugin",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-black-ui",
    title: "Refreshed plugin UI",
    description:
      "The plugin UI now uses a clean black and white design instead of the previous blue Figma brand buttons, matching the Layout Studio aesthetic.",
    product: "figma-plugin",
    category: "improved",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-create-project",
    title: "Create projects from the plugin",
    description:
      "Start a new Layout project directly from the Figma plugin header without switching to the web app.",
    product: "figma-plugin",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-figma-layout-md-rename",
    title: "layout.md support",
    description:
      "The Figma plugin now uses the new layout.md filename, matching the rename across all Layout tools.",
    product: "figma-plugin",
    category: "improved",
    date: "2026-03-29",
  },
  // --- Chrome Extension ---
  {
    id: "2026-w13-extension-launch",
    title: "Chrome extension for website extraction",
    description:
      "New Chrome extension lets you extract design systems from any website. Click Extract to capture colours, typography, spacing, and components, then open the result in Layout Studio.",
    product: "chrome-extension",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-extension-create-project",
    title: "Create projects from the extension",
    description:
      "Start a new Layout project directly from the extension settings without switching to the web app.",
    product: "chrome-extension",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-extension-copy-element",
    title: "Copy Element to clipboard",
    description:
      "Select any element on a page and copy its styles to your clipboard, ready to paste into your layout.md or code.",
    product: "chrome-extension",
    category: "new",
    date: "2026-03-29",
  },
  {
    id: "2026-w13-extension-capture-fix",
    title: "Better full-page captures",
    description:
      "Full-page screenshots now hide fixed and sticky elements (navbars, cookie banners) that previously covered the captured content.",
    product: "chrome-extension",
    category: "fixed",
    date: "2026-03-29",
  },
];
