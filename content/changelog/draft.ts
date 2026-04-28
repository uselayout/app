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
    id: "2026-w18-extraction-warm-cool-colours",
    title: "Site extraction now picks up brand yellows, pinks, and purples",
    description:
      "Extracting a colourful site like headspace.com used to produce a layout.md dominated by neutrals and one or two blues — the yellow banner, pink hero card, and purple Sleepcast tile mostly didn't make it through. The extractor now scrolls the page so below-the-fold sections paint, runs a bounded DOM walk that captures non-default background colours on every visible element (skipping SVG icon fills so decorative illustration colours don't pollute the palette), and the standardiser has new accent-warm and accent-cool roles plus a relaxed yellow gate so vivid brand surfaces actually land in the curated palette instead of being dropped or mis-categorised as generic surface tokens.",
    product: "studio",
    category: "improved",
    date: "2026-04-28",
  },
  {
    id: "2026-w18-kit-visit-site-link",
    title: "Visit-site link on kit pages",
    description:
      "Kit pages now show a small \"Visit pinterest.com ↗\" pill next to the licence chip when the brand has a homepage URL set, so visitors can jump from the kit straight to the design system in the wild. Layout admins can paste the URL into the Kits tab in the admin panel.",
    product: "studio",
    category: "new",
    date: "2026-04-28",
  },
  {
    id: "2026-w18-bespoke-showcase-auto-retry",
    title: "Fewer failed kit showcase generations",
    description:
      "When Claude occasionally emitted a typo in the ~50KB of TSX it generates for a bespoke kit showcase, the whole generation failed and the kit ended up without its bespoke preview. The generator now retries once on a transpile error or missing export — almost always succeeds on the second sample without operator intervention.",
    product: "studio",
    category: "fixed",
    date: "2026-04-28",
  },
  {
    id: "2026-w18-explore-refine-feedback-and-resize",
    title: "Clearer feedback when you refine a variant + grabbier code-pane handle",
    description:
      "Hitting Enter on a per-variant refine prompt now shows a 'Refining…' overlay on the originating card while the AI is running, and the skeleton card below says 'Refining \"variant name\"…' instead of a generic 'Generating…'. Also widened the split-view code pane's resize handle from a 1px line to a proper 8px hit area, and made it use pointer capture so dragging across the inspector iframe no longer kills the drag.",
    product: "studio",
    category: "improved",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-explore-split-view-code-editor",
    title: "Edit a variant's code right next to its preview",
    description:
      "Inspect mode now has a Code button in the top bar. Click it and a Monaco editor opens to the right of the preview, bound to the variant's TSX. Type in the code, the preview re-renders after a brief debounce. Drag the inspector to change a colour, the code on the right updates to match. If your edit produces a syntax error, the line is squiggled red in the editor and the same error shows in the preview pane — much faster than the regenerate-and-pray loop. The pane remembers its width across sessions, and clicking View code on a failed render now lands you directly in the editor with the broken line highlighted.",
    product: "studio",
    category: "new",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-transpile-rejects-syntax-errors",
    title: "Clearer errors when an AI-generated variant has a typo",
    description:
      "If Claude generated a variant with a JavaScript typo (we saw one with i / > 0 instead of i > 0), TypeScript would emit broken JS without complaining and the preview iframe was the first thing to choke on it — surfacing a cryptic 'Unexpected token >' at a random srcdoc line. The transpile API now checks TypeScript's diagnostics and rejects the request with a clear 'TSX syntax error: Expression expected.' message, which the variant card shows directly. Means a one-character regen fixes it instead of a guessing game.",
    product: "studio",
    category: "improved",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-explore-failed-render-actions",
    title: "Better recovery when an Explorer variant fails to render",
    description:
      "When a generated variant hit a JavaScript error in the preview iframe, the only thing on offer was a Retry render button — which couldn't help, because the same code parses the same way every time. The card now shows the full error (with line and column), an expandable Show details panel for multi-line stack traces, and replaces Retry render with View code on parse-time errors so you can jump straight into inspect mode and look at the variant. Retry is still there for transient failures like a transpile timeout. The variant code is also logged to the browser console under [variant-render-error] so we can dig into the underlying bug from a screenshot.",
    product: "studio",
    category: "improved",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-layout-md-no-truncation",
    title: "Larger design systems now generate fully",
    description:
      "Pushing a really token-rich extraction (lots of CSS variables, fonts, components) could leave layout.md cut off mid-table inside Appendix A. Layout now uses each model's full output capacity, and if it still hits the limit, automatically continues the response from where it stopped. You get the complete file in one go. If even the continuation runs out of room, you'll see a clear marker in the file instead of a silent truncation.",
    product: "studio",
    category: "fixed",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-extension-install-docs",
    title: "Chrome extension install instructions match the actual ZIP",
    description:
      "The install steps on the Chrome extension docs page told you to load a 'dist' folder inside the unzipped directory. The alpha ZIP doesn't contain one. manifest.json sits at the root of the unzipped folder. Updated the instructions so you select the layout-chrome-extension-alpha folder directly.",
    product: "studio",
    category: "fixed",
    date: "2026-04-27",
  },
  {
    id: "2026-w18-admin-regen-no-503",
    title: "Regenerating a kit from admin no longer takes the gallery offline",
    description:
      "Hitting Regenerate Showcase on a kit in the admin panel could push the staging container into 100% CPU and bounce every public page to a 'no available server' screen until the container restarted. The cause was a single regex used to strip @keyframes blocks from the kit's tokens.css before sending to Claude — its nested quantifiers caused catastrophic backtracking on tokens.css files with many brace pairs but no @keyframes (Linear's, for one). Replaced with a linear-time bracket counter, plus belt-and-braces caps so any future slow path can't starve the readiness probe either.",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-stable-during-bespoke-regen",
    title: "Gallery stays online during bulk kit regeneration",
    description:
      "Generating a bespoke Live Preview for a kit means a long Claude call followed by a CPU-heavy TypeScript transpile. When several kits regenerated in parallel the staging container's single Node thread saturated, the readiness probe timed out, and the gallery briefly returned a 'no available server' page. Bulk regen now runs locally on the operator's machine and posts the finished bespoke straight to the kit; the live server only handles small DB writes. Kits stay served throughout.",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-kit-style-profile",
    title: "Live Preview now feels like the actual brand",
    description:
      "Each kit's Live Preview used to render the same generic component sample with different colours swapped in — Stripe, Linear, and Apple all looked oddly similar. Now Claude derives a small per-kit style profile from layout.md and tokens.css describing how each block should render: button radius, fill style, input focus treatment, card elevation, badge shape, tab indicator, density. Apple gets soft 18px-ish buttons, Linear keeps pills, IBM gets sharp corners, Notion's cards get a subtle shadow. Auto-runs on every publish.",
    product: "studio",
    category: "new",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-rich-component-preview",
    title: "Live Preview shows a full component palette",
    description:
      "The component sample on a kit page used to be three things: buttons, an input, a card. It now spans buttons (with size variants), four input types (search with icon, prefix, select, textarea), field states (default / focused / error), interactive toggles + checkboxes + radios, status badges, tabs, segmented control, an avatar group, progress + skeleton, an alert banner, KPI tiles, a rich card, and a mini data table. Hover states everywhere; controls actually flip when you click them.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-hero-and-share",
    title: "Brand-aware hero + share button on the gallery",
    description:
      "Each kit page now leads with the brand's logo, name, and one-line description in the Live Preview header — same shape as the Notion-style header you may have seen on bespoke kits. Added a Share button next to the upvote / licence chips (Web Share where available, copy-link fallback). And a 'Read the CLI docs' link sits under the npm install command for anyone hitting Layout for the first time.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-fixes-borders-buttons",
    title: "Live Preview rendering fixes",
    description:
      "Three quiet bugs squashed: card outlines on Linear no longer render in green (the picker was mistakenly grabbing semantic-state colours like --color-success-border before the neutral one); Primary and Accept button labels stay readable on kits with dark or near-black accents (Apple, Ramp, Nike) instead of disappearing into the background; the spacing and radius scale ladders now use a neutral text-tint instead of the kit's accent so the eye reads sizes, not a wall of brand colour.",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-admin-kits-row-tidy",
    title: "Tidier admin kit row + cached bespoke restore",
    description:
      "The admin Kits table row had grown to seven inline buttons; they're now grouped into Card / Status / Generate dropdowns with a clearer visual hierarchy. The Generate dropdown also gains two improvements: when a kit was Claude-generated then flipped to uniform, you can now Restore the cached bespoke instantly without re-running Claude; and a Profile column shows when each kit's style profile was last derived.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-curated-mode-seeding",
    title: "Light/Dark mode tabs in Curated populate themselves",
    description:
      "Multi-mode kits like the Figma SDS used to land users on a Curated view full of empty mode tabs. Three fixes: 1) the auto-fill now seeds every detected colour mode at once \u2014 SDS Light and SDS Dark fill from their respective token twins instead of waiting for a Copy from Light click; 2) non-colour modes (Desktop / Mobile / Tablet, which only tag spacing tokens) no longer leak into the colour-mode toggle and clutter it with empty tabs; 3) any mode whose name contains \u201cdark\u201d (SDS Dark, dark-theme, dark) now gets a moon icon for parity with Light\u2019s sun.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-kit-wishlist",
    title: "Wishlist on the Kit Gallery",
    description:
      "Want a kit added to the gallery? Drop the URL on the new wishlist below the kit grid, and upvote the ones you'd actually use. The page auto-fetches the brand name from the URL so you only need to paste a link. Once a matching kit ships, your request gets marked fulfilled automatically.",
    product: "studio",
    category: "new",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-explore-enter-submits",
    title: "Explore: Enter submits, Shift+Enter adds a line break",
    description:
      "Explorer prompt fields now submit on Enter so you can dispatch a generation without reaching for Cmd+Enter. Hold Shift while pressing Enter to insert a newline if you want a multi-line prompt. Behaviour matches every other AI input you've used; both the main prompt and the Refine field follow the same convention.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-tokens-match-studio",
    title: "Gallery Tokens tab now lists everything the studio sees",
    description:
      "Kits like Linear documented tokens (accent-purple, surface-page, text-primary, normal-border) in the layout.md narrative that never made it into the published tokens.json, so the gallery's Tokens tab showed fewer tokens than the studio's All Tokens view. Publish now parses every CSS declaration found anywhere in layout.md and unions it with the project's extraction data, so gallery and studio agree. Existing extraction tokens still win on collision (the studio version is authoritative).",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-border-radius-classification",
    title: "Border-radius tokens stop showing in the BORDERS group",
    description:
      "An 8px border-radius token was rendering as a white swatch in the All Tokens BORDERS group because the layout.md parser checked the word border before radius and classified the value as a colour. The order is reversed so border-radius / corner-radius go where they belong, while border-color / border-default / border-success still classify as colours.",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-curated-status-prefix-demotion",
    title: "Status colours stop stealing default role slots",
    description:
      "On kits with status colours (success-border, info-bg, warning-text, border-error, etc.) and an unprefixed default variant (normal-border, bg-app, text-primary), the matcher could pick a status colour as the default because both candidates tied on score and iteration order chose the wrong one. Tokens with a status word in any segment (success, warning, error, danger, info, positive, negative, destructive, critical) are now demoted when matching default-tier roles (backgrounds, text, borders, accent), regardless of whether the status word appears as a prefix or suffix. Status roles themselves are unaffected.",
    product: "studio",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-curated-picker-show-all",
    title: "Curated token picker shows every token",
    description:
      "Clicking an empty role slot or an existing swatch in the Curated Design System view used to hide everything past the first 50 tokens behind a low-contrast +N more text link. With 200+ colour tokens that meant most of your palette was effectively invisible. The picker now lists the full pool in a scrolling region, shows the total count in the header (and X / Y when search narrows it), and is slightly wider so longer token names like background-positive-secondary-hover stop truncating.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-curated-auto-fill-from-tokens",
    title: "Auto-fill curated roles from your tokens",
    description:
      "When the Curated Design System view shows empty role slots (after a fresh extraction or re-import), there's now an Auto-fill from tokens button next to the mode toggle. One click runs the matcher against your current token pool and snapshots the previous state so you can roll back. The matcher itself learnt the Figma SDS naming pattern: background-default and background-secondary now find App Background and Surface, background-tertiary fills Elevated, background-hover fills Hover, blanket fills Overlay, and text-neutral-secondary / text-neutral-tertiary land in Secondary and Muted text. Files using semantic Figma tokens map cleanly without manual assignment.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-uniform-by-default",
    title: "Gallery Live Preview now uses our uniform template by default",
    description:
      "Every kit's Live Preview now renders through the hand-built Layout template by default. Faster (no AI wait), free (no Claude credits), and improvements ship to every kit at once. Existing kits with a Claude-generated bespoke showcase keep it. New publishes can still opt in to a bespoke AI layout via a checkbox on the Share modal.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-figma-plugin-0-2-11-no-collisions",
    title: "Figma plugin keeps every colour ramp on extraction",
    description:
      "Files with multiple colour ramps (Brand, Red, Green, Yellow, Slate, Gray) were collapsing to a single greyscale palette because the plugin stripped the first slash segment from every variable name, so Brand/100 and Red/100 both became 100 and overwrote each other. Variable names now keep the full path, so every ramp and every semantic group (Background/Brand/Default, Text/Positive/Default, etc.) flows through to Layout. Re-download the plugin (v0.2.11) from the docs page to pick up the fix.",
    product: "figma-plugin",
    category: "fixed",
    date: "2026-04-26",
  },
  {
    id: "2026-w18-gallery-new-badge-and-cleaner-admin",
    title: "Gallery cards get a New badge, admin row gets tidier",
    description:
      "Admins can now mark a kit as New (green badge on the gallery card, mirrors the Featured pattern). The admin Kits row is also cleaner: the three regen actions (showcase, preview, hero) collapsed into a single Generate dropdown so the row stops being a wall of buttons.",
    product: "studio",
    category: "improved",
    date: "2026-04-26",
  },
  {
    id: "2026-w17-gallery-pending-review",
    title: "Self-published kits go through admin review",
    description:
      "Kits published from Studio now land in a Pending review queue and only appear on the public gallery once the Layout team approves. Approving fires the showcase, preview and hero generation jobs in one click. Quality control without friction; layout-team publishes still go straight live.",
    product: "studio",
    category: "improved",
    date: "2026-04-25",
  },
  {
    id: "2026-w17-gallery-card-image-control",
    title: "Pick the gallery card image",
    description:
      "Admins can now choose which image shows on each kit's gallery card without regenerating: auto, custom upload, hero, or preview. Upload your own 1440\u00d71080 PNG/JPG/WEBP via the new Upload card button when AI-generated covers don't quite land.",
    product: "studio",
    category: "new",
    date: "2026-04-25",
  },
  {
    id: "2026-w17-gallery-tokens-tab-full",
    title: "Gallery Tokens tab now lists every token, not just colours",
    description:
      "The Tokens tab on each kit page now walks the full W3C DTCG tokens.json and surfaces colours (with swatches), typography (font families, sizes, weights, line heights), spacing (as scaled bars), radius (as rounded samples) and shadows. Previously nested tokens like color.bg.app or color.text.primary were being dropped, so the tab showed up empty on most kits.",
    product: "studio",
    category: "fixed",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-showcase-dark-text-fix",
    title: "Showcase text stays readable on dark kits",
    description:
      "Kits with dark-first tokens (Linear-style) were rendering the showcase hero and section headers in near-black text on near-black backgrounds. Foreground picking now prefers semantic names like text-primary, foreground and text-default, then falls back to the highest-contrast token of the right polarity, then to a hard-coded near-white so we never render dark on dark again.",
    product: "studio",
    category: "fixed",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-admin-regen-hero-byok",
    title: "Regen hero now honours your own OpenAI key",
    description:
      "Admins can generate Kit Gallery hero covers with their own OpenAI key. The Regen hero button in /admin > Kits forwards the key saved in Settings > API Keys on every call, falling back to the server-side OPENAI_API_KEY when one is set.",
    product: "studio",
    category: "improved",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-kit-gallery-hero-image",
    title: "Gallery cards get a stylised hero cover via GPT Image 2",
    description:
      "Every kit can now carry a second, marketing-grade preview image generated by GPT Image 2 from the kit's colours, tags and name. Card thumbnails prefer the hero when present, falling back to the Playwright screenshot and finally the gradient placeholder. Admins get a new Regen hero button in /admin > Kits alongside the existing Regen showcase and Regen preview actions. New kits auto-generate a hero on publish.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-admin-email-personalisation",
    title: "Personalise broadcast emails with each recipient's name",
    description:
      "The admin Email tab now supports {{firstName}}, {{name}} and {{email}} placeholders anywhere in the subject or body. Each broadcast is personalised per recipient before sending, with a sensible fallback when no name is on file, so marketing emails always open with a real greeting instead of \"Hi ,\". Click the chips under the message box to insert a placeholder at the cursor.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-kit-gallery-ai-showcase",
    title: "Claude writes a bespoke showcase for every new kit",
    description:
      "Publishing a kit now kicks off two background jobs: Claude Sonnet writes a bespoke design-system showcase tailored to the kit's aesthetic, and Playwright snapshots it as a PNG card thumbnail. Card previews on /gallery stop being gradient placeholders and start looking like the actual design system. Admins get Regen showcase and Regen preview buttons in the admin Kits tab to re-run either step for any existing kit.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-kit-gallery-showcase",
    title: "Every kit in the Gallery renders live against its own tokens",
    description:
      "Gallery kit pages now show a Live Preview tab alongside the Tokens and layout.md tabs. The preview renders a uniform showcase (palette, typography scale, spacing, radius, shadows, sample components) styled with each kit's own CSS variables, so comparing kits is genuinely visual instead of staring at markdown.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-profile-avatar-upload",
    title: "Upload a profile picture",
    description:
      "Settings > Profile now has a Profile picture section. Upload a PNG, JPG or WEBP (up to 2MB) and your avatar flows through to the Studio sidebar, the author row on any kit you publish, and anywhere your name appears.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-kit-gallery-public-browse",
    title: "Browse community kits at layout.design/gallery",
    description:
      "A new public gallery page lists design-system kits anyone can import into Layout Studio with one click, or install from the CLI with npx @layoutdesign/context install <slug>. Filter by tag, search by name, sort by Featured / Top / New. Linear, Stripe and Notion lookalike kits are seeded to start.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-kit-gallery-share-and-import",
    title: "Share your Studio project as a public kit",
    description:
      "A new Share button in the Studio top bar publishes the current project as a public kit (MIT or CC-BY by default, or bring your own licence). Pick minimal (tokens + layout.md only) or rich (components, fonts, branding, context docs too). The New Project modal also gets a Browse Kits tab for importing any public kit without leaving Studio.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-vs-design-md-comparison-page",
    title: "How Layout compares to Google's design.md",
    description:
      "A new page at /vs/design-md lays out where Layout and Google's newly open-sourced design.md agree, where Layout goes further (multi-source extraction, Figma sync, Kit Gallery, AI variant generation), and what we're borrowing from them (CLI linter, diff command, formal spec, awesome-list distribution). Also added a Google design.md column to /docs/compare so you can see Layout's superset at a glance.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-companion-design-md-export",
    title: "Export bundles now ship a companion design.md",
    description:
      "Your export ZIP now includes a design.md alongside layout.md, formatted for compatibility with Google's design.md spec. Agents trained on Google's format (Stitch, stitch-skills, and anything downstream of Google Labs Code) can read your design system without configuration. layout.md remains canonical and carries our extras (three-tier tokens, multi-mode, motion, confidence annotations) that design.md doesn't yet model.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-canonical-spec-url",
    title: "layout.design/spec is the canonical spec URL",
    description:
      "Formal specification for the layout.md format is now reachable at layout.design/spec (redirects to the in-docs spec page). Clean URL to share with engineers, investors, and anyone writing a DESIGN.md-style file.",
    product: "studio",
    category: "improved",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-openai-gpt-image-2",
    title: "Generate logos and wordmarks with OpenAI GPT Image 2.0",
    description:
      "Add an OpenAI API key in Settings and Layout now routes text-heavy image prompts (logos, wordmarks, diagrams, posters) to OpenAI's new GPT Image 2.0, which renders text legibly where Gemini blurs it. Gemini still handles photos and illustrations. The Branding tab also gets a Generate with AI button so you can spin up a primary logo, wordmark or favicon from a prompt and use it everywhere the data-brand-logo attribute resolves.",
    product: "studio",
    category: "new",
    date: "2026-04-24",
  },
  {
    id: "2026-w17-byok-credit-error-clarity",
    title: "Clearer message when your own Anthropic credits run out",
    description:
      "If you're using your own Anthropic API key and it runs out of credits mid-generation, Layout now tells you clearly and points you to console.anthropic.com to top up, instead of showing a generic API error. You can also switch back to hosted mode from Settings if you'd rather Layout handle the billing.",
    product: "studio",
    category: "improved",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-supabase-restart-resilience",
    title: "Stay signed in during brief database restarts",
    description:
      "If the database briefly goes away (for a restart or migration), you'll now see a short \"Layout is briefly unavailable\" page instead of being logged out and bounced to the sign-in screen. Your session stays valid, and a quick refresh gets you back to work.",
    product: "studio",
    category: "improved",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-figma-plugin-variable-modes",
    title: "Light and dark Figma Variables sync as separate tokens",
    description:
      "If your Figma file has Variables with light and dark modes, the plugin now emits a token per mode rather than collapsing them. Push from Figma and your design system in Layout gets matching light + dark assignments out of the box, ready for the Curated view's mode toggle.",
    product: "figma-plugin",
    category: "new",
    date: "2026-04-23",
  },
  {
    id: "2026-w17-figma-plugin-variables-sync",
    title: "Sync colours and spacing from Figma Variables",
    description:
      "The plugin now reads native Figma Variables for colour and spacing, in addition to local styles. If your team uses Variables (the modern way to manage tokens in Figma), they flow straight into Layout without you having to convert anything to styles first.",
    product: "figma-plugin",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-figma-plugin-extract-ux",
    title: "Clearer extraction state and Variables controls in the plugin",
    description:
      "Extract now shows a loading state so you know it's working, and the plugin remembers when you last pushed so the Push button labels what it's about to do. The Variables section gets its own toggle and the banner contrast is easier on the eyes.",
    product: "figma-plugin",
    category: "improved",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-token-divergence-banner",
    title: "Spot and fix token gaps between extraction and layout.md",
    description:
      "When your extracted tokens drift from what's in layout.md (because you re-extracted, edited the markdown by hand, or pushed from the plugin), a divergence banner now lists exactly which tokens are missing or have a different value. Fix them one at a time, or hit Merge all to append the missing ones into the right sections automatically. Cosmetic-only differences (whitespace, hex case) are no longer flagged.",
    product: "studio",
    category: "new",
    date: "2026-04-20",
  },
  {
    id: "2026-w17-token-role-pickers",
    title: "Friendlier token role pickers in the Design System page",
    description:
      "Click a colour swatch in the Curated view to open the extracted-token picker (no more typing hex codes). For non-colour roles like spacing, radius, font weight and motion, the picker now lets you either pick from extracted values or type a custom one (16px, 600, 200ms) without leaving the row. Typography roles render real type specimens so you can see the choice at a glance.",
    product: "studio",
    category: "improved",
    date: "2026-04-19",
  },
  {
    id: "2026-w17-inspector-logo-variants",
    title: "Brand logos support colour, white, black and mono variants",
    description:
      "Upload variants of the same logo (full colour, white knockout, black, monochrome) and Layout will pick the right one based on the surface it's placed on. The Inspector logo picker shows all variants so you can swap manually if the AI's choice isn't right.",
    product: "studio",
    category: "new",
    date: "2026-04-19",
  },
  {
    id: "2026-w17-opus-47-default",
    title: "Smarter, cheaper AI generation with Opus 4.7 and prompt caching",
    description:
      "Variant generation now uses Claude Opus 4.7 by default, with prompt caching turned on so repeated work against the same design system is faster and cheaper. Each task (Explorer, layout.md edits, Inspector tweaks) can be configured to a different model from the admin panel, and you'll see a clearer prompt to top up if you run out of credits mid-flow.",
    product: "studio",
    category: "improved",
    date: "2026-04-18",
  },
  {
    id: "2026-w16-inspector-tailwind-responsive",
    title: "Inspector edits keep responsive Tailwind classes",
    description:
      "Editing a class via the Inspector used to strip responsive prefixes like sm:, md: and lg: from the surrounding classes, breaking the variant's responsive behaviour. The edit now preserves them so your breakpoint styles stay intact.",
    product: "studio",
    category: "fixed",
    date: "2026-04-16",
  },
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
