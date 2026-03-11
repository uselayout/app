# Layout — Product Requirements Document

## Version 1.0 | March 2026 | Phase 1: Internal Tool

---

## 1. Product Overview

Layout is a browser-based tool that extracts design systems from Figma files and live websites, then transforms them into structured, LLM-optimised context bundles (DESIGN.md) that enable AI coding agents to produce on-brand UI code consistently.

**Core Value Proposition:** The compiler between design systems and AI coding agents.

**Phase 1 Scope:** Internal tool only. No auth, no database, localStorage only. Focus entirely on making the core extraction-to-testing workflow excellent.

### Target Audience
- Vibe coder founders building with Claude Code/Cursor
- Agency developers managing multiple client design systems
- Design systems architects bridging Figma and AI agents

---

## 2. User Stories

### Epic 1: Project Foundation & Layout

#### US-1: App Shell and Navigation
```gherkin
Feature: App shell and navigation
  As a user
  I want a polished dark-themed application shell
  So that the tool feels professional and purpose-built

  Scenario: Landing page loads
    Given I navigate to the root URL
    Then I see the Layout landing page
    And the page has a dark theme with the Studio design tokens
    And there is a URL input field for Figma/website URLs
    And there is a row of pre-built AI Kit templates

  Scenario: Navigate to Studio
    Given I have started an extraction
    When the extraction completes
    Then I am redirected to /studio/[id]
    And the three-panel layout is visible
```

#### US-2: Three-Panel Studio Layout
```gherkin
Feature: Three-panel resizable layout
  As a user
  I want a three-panel layout with drag-to-resize handles
  So that I can adjust my workspace to my preference

  Scenario: Default layout renders
    Given I navigate to /studio/[id]
    Then I see three panels: Source (left, 280px), Editor (centre, fills space), Test (right, 340px)
    And there are drag handles between panels
    And the top bar shows project name, save status, and action buttons

  Scenario: Resize panels
    Given I am on the Studio page
    When I drag a panel resize handle
    Then the adjacent panels resize smoothly
    And minimum panel widths are enforced (200px minimum)
```

#### US-3: Top Bar Component
```gherkin
Feature: Studio top bar
  As a user
  I want a top bar with project info and quick actions
  So that I can access key functions without navigating away

  Scenario: Top bar displays project info
    Given I am on the Studio page
    Then the top bar shows the project name (editable inline)
    And shows "Saved Xs ago" with relative timestamp
    And shows source badge (Figma or Website icon)
    And shows action buttons: Re-extract, Test, Export
```

### Epic 2: Figma Extraction

#### US-4: Figma URL Input and Validation
```gherkin
Feature: Figma URL input
  As a user
  I want to paste a Figma file URL and my PAT
  So that the extraction can begin

  Scenario: Valid Figma URL submitted
    Given I am on the landing page
    When I paste a valid Figma file URL (figma.com/file/... or figma.com/design/...)
    And I enter my Figma Personal Access Token
    And I click "Extract Design System"
    Then the extraction progress screen appears
    And extraction begins

  Scenario: Invalid URL rejected
    Given I am on the landing page
    When I paste an invalid URL
    Then I see a validation error message
    And the extract button remains disabled
```

#### US-5: Figma Styles Extraction
```gherkin
Feature: Figma styles extraction
  As a user
  I want my Figma colour, text, and effect styles extracted
  So that the design tokens are captured accurately

  Scenario: Colour styles extracted
    Given I have submitted a valid Figma URL and PAT
    When the extraction runs
    Then colour styles are fetched via GET /v1/files/{key}/styles
    And actual values are resolved via GET /v1/files/{key}/nodes?ids=...
    And fills[0] RGBA values are converted to hex
    And colour tokens are normalised to ExtractedToken format

  Scenario: Text styles extracted
    Given the extraction is running
    Then text styles are fetched and resolved
    And TypeStyle properties are parsed (fontFamily, fontSize, fontWeight, lineHeight, letterSpacing)
    And typography tokens are normalised

  Scenario: Effect styles extracted
    Given the extraction is running
    Then effect styles (shadows, blurs) are fetched and resolved
    And shadow/blur arrays are parsed with color, offset, radius, spread
```

#### US-6: Figma Components Extraction
```gherkin
Feature: Figma components extraction
  As a user
  I want my Figma components and variants extracted
  So that component specifications are captured

  Scenario: Components inventory built
    Given the extraction is running
    When GET /v1/files/{key}/components is called
    And GET /v1/files/{key}/component_sets is called
    Then component names, descriptions, and variant counts are captured
    And componentPropertyDefinitions are parsed
    And the top 50 components by usage are enriched with full node data
```

#### US-7: Figma Rate Limit Management
```gherkin
Feature: Figma API rate limiting
  As a developer
  I want rate limits handled gracefully
  So that extractions don't fail due to API throttling

  Scenario: Rate limit respected
    Given the extraction is making Figma API calls
    Then requests have a minimum 100ms delay between calls
    And node ID batches are limited to 50 per request

  Scenario: 429 response handled
    Given a Figma API call returns 429
    Then the system retries with exponential backoff and jitter
    And the progress UI shows "Rate limited, retrying..."
```

#### US-8: Extraction Progress UI
```gherkin
Feature: Extraction progress display
  As a user
  I want to see detailed progress during extraction
  So that I know it's working and how long it will take

  Scenario: Progress updates shown
    Given an extraction is running
    Then I see a full-screen progress view
    And each extraction step shows status (pending/running/complete/failed)
    And a progress bar shows overall percentage
    And estimated time remaining is displayed
    And granular detail is shown ("Extracting colour styles 12/34...")
```

### Epic 3: Website Extraction

#### US-9: Website CSS Extraction
```gherkin
Feature: Website CSS extraction
  As a user
  I want design tokens extracted from a live website
  So that I can create an AI Kit from any site

  Scenario: CSS custom properties extracted
    Given I submit a website URL
    When Playwright navigates to the page
    Then all CSS custom properties from :root and theme selectors are extracted
    And @font-face declarations are captured
    And computed styles for key elements (h1-h3, p, button, input, a, card) are extracted
    And @keyframes animations are captured
    And media query breakpoints are detected

  Scenario: Library detection
    Given the extraction is running
    Then the system detects Tailwind, Bootstrap, Material UI, shadcn, Radix, Next.js
    And detection results are included in the extraction data
```

#### US-10: Website Screenshots
```gherkin
Feature: Website screenshot capture
  As a user
  I want screenshots taken of the target website
  So that Claude can visually analyse the design

  Scenario: Screenshots captured
    Given Playwright has navigated to the website
    Then a full-page screenshot is captured
    And a viewport screenshot is captured
    And screenshots are stored for display in the Source panel
```

### Epic 4: DESIGN.md Generation

#### US-11: Claude Synthesis
```gherkin
Feature: DESIGN.md generation via Claude
  As a user
  I want Claude to generate a structured DESIGN.md from extracted data
  So that I have a complete AI-ready design context file

  Scenario: DESIGN.md generated with all sections
    Given extraction has completed (Figma or website)
    When the synthesis API is called
    Then Claude generates a DESIGN.md following the 8-section format:
      | Section | Content |
      | 0. Quick Reference | Top 15 rules |
      | 1. Visual Identity | Design character + principles |
      | 2. Colour System | CSS custom properties + usage rules |
      | 3. Typography | Type scale + hierarchy table |
      | 4. Spacing & Layout | Spacing scale + spatial rules |
      | 5. Components | Component specifications |
      | 6. Patterns | Page layout patterns |
      | 7. Motion | Timing functions + motion rules |
      | 8. Anti-Patterns | Never do / Always do lists |
    And the response streams into the Monaco editor in real-time

  Scenario: Token-efficient output
    Given the DESIGN.md is generated
    Then the estimated token count is displayed
    And it targets <6K tokens (green), warns at 6-8K (yellow), alerts >8K (red)
```

### Epic 5: Monaco Editor

#### US-12: Monaco Editor Setup
```gherkin
Feature: Monaco markdown editor
  As a user
  I want a professional markdown editor for DESIGN.md
  So that I can refine the generated content

  Scenario: Editor loads with correct configuration
    Given I am on the Studio page
    Then the Monaco editor loads with markdown language mode
    And uses the custom dark theme matching Studio palette
    And has word wrap enabled
    And uses Geist Mono font at 14px
    And has minimap disabled and line numbers off
    And has padding (top: 20, bottom: 80)

  Scenario: Editor is editable
    Given the DESIGN.md is loaded in the editor
    When I type in the editor
    Then the content updates
    And auto-save triggers after 5 seconds of inactivity
    And "Saved" indicator briefly appears
```

#### US-13: Token Autocomplete
```gherkin
Feature: CSS token autocomplete in editor
  As a user
  I want autocomplete suggestions for CSS tokens
  So that I can reference design tokens accurately

  Scenario: Token suggestions appear
    Given I am editing inside a code block in the editor
    When I type "--"
    Then a suggestion dropdown appears with all extracted CSS custom property names
    And each suggestion shows its value as documentation
    And selecting a suggestion inserts the full variable name
```

#### US-14: Section Navigator
```gherkin
Feature: DESIGN.md section navigator
  As a user
  I want quick navigation between DESIGN.md sections
  So that I can jump to specific sections efficiently

  Scenario: Section headings detected
    Given the DESIGN.md is loaded
    Then ## headings are detected and rendered as clickable markers
    And clicking a marker scrolls the editor to that section
```

### Epic 6: Source Panel

#### US-15: Token Tree Browser
```gherkin
Feature: Token tree browser
  As a user
  I want to browse extracted tokens in a structured tree
  So that I can review and understand the design system

  Scenario: Tokens displayed in tree
    Given extraction has completed
    Then the Tokens tab shows a categorised tree:
      | Category | Display |
      | Colors | Colour swatch + name + hex value |
      | Typography | Font family, sizes, weights |
      | Spacing | Scale values |
      | Radius | Border radius values |
    And clicking a token name copies the CSS variable to clipboard

  Scenario: Token editing
    Given I am viewing the token tree
    When I click the edit icon on a token
    Then I can modify the value inline
    And the change syncs to the DESIGN.md in the editor
```

#### US-16: Components List
```gherkin
Feature: Components inventory display
  As a user
  I want to see extracted components listed
  So that I can review what was captured

  Scenario: Components shown
    Given extraction has completed
    Then the Components tab shows each component with:
      | Field | Example |
      | Name | Button |
      | Variants | 4 variants |
      | Description | Primary action button |
    And clicking "Go to in DESIGN.md" scrolls the editor to the component section
```

#### US-17: Screenshots Gallery
```gherkin
Feature: Screenshots gallery
  As a user
  I want to view extraction screenshots
  So that I can verify what was captured visually

  Scenario: Screenshots displayed
    Given a website extraction has completed
    Then the Screenshots tab shows a grid of captured screenshots
    And clicking a screenshot opens a fullscreen lightbox
```

### Epic 7: Test Panel

#### US-18: AI Test Panel
```gherkin
Feature: AI test panel
  As a user
  I want to test Claude's output against my DESIGN.md
  So that I can validate the context quality before exporting

  Scenario: Test with context enabled
    Given I am on the Studio page with DESIGN.md loaded
    And the context toggle is ON
    When I type "Build me a primary button" and press enter
    Then Claude receives the DESIGN.md as system context
    And the response streams in the output area
    And code blocks are syntax-highlighted

  Scenario: Test without context (bare Claude)
    Given the context toggle is OFF
    When I submit a prompt
    Then Claude responds WITHOUT DESIGN.md context
    And the panel label changes to "Bare Claude" with orange indicator

  Scenario: Quick prompts
    Given components were extracted
    Then the "Quick prompts" dropdown contains auto-generated prompts
    And prompts are based on the component inventory (e.g. "Build me a Card component")
```

#### US-19: Basic Health Score
```gherkin
Feature: Basic context health score
  As a user
  I want a simple quality score for Claude's test output
  So that I know if my DESIGN.md is effective

  Scenario: Health score calculated
    Given Claude has responded to a test prompt
    Then a score (0-100) is displayed
    And it checks: hardcoded hex values, correct font usage, CSS variable usage
    And issues are listed with specific violations
    And thumbs up/down rating buttons are shown
```

### Epic 8: Export System

#### US-20: Export Modal
```gherkin
Feature: Export modal
  As a user
  I want to select export formats and download a bundle
  So that I can use the AI Kit in my projects

  Scenario: Export modal opens
    Given I am on the Studio page
    When I click "Export" or press Cmd+Shift+E
    Then a modal appears with format checkboxes:
      | Format | Description |
      | CLAUDE.md | Drop-in section for Claude Code projects |
      | .cursor/rules | Cursor rules (.mdc files) |
      | tokens.css | CSS custom properties |
      | tokens.json | W3C DTCG format |
      | tailwind.config.js | Tailwind theme extension |

  Scenario: Bundle downloaded
    Given I have selected export formats
    When I click "Download Bundle"
    Then a ZIP file is generated containing all selected formats
    And the ZIP downloads to my machine
```

#### US-21: CLAUDE.md Export
```gherkin
Feature: CLAUDE.md generation
  As a user
  I want a drop-in CLAUDE.md section generated
  So that Claude Code uses my design system automatically

  Scenario: CLAUDE.md section generated
    Given I export with CLAUDE.md selected
    Then the file contains a "Design System" section with:
      | Content | Source |
      | Critical rules | Top 10 from Quick Reference |
      | File references | Paths to DESIGN.md, COMPONENTS.md, tokens.css |
      | Instructions | "Read DESIGN.md before building UI" |
```

#### US-22: Cursor Rules Export
```gherkin
Feature: Cursor rules export
  As a user
  I want .cursor/rules files generated
  So that Cursor AI follows my design system

  Scenario: Cursor rules generated
    Given I export with Cursor rules selected
    Then design-system.mdc is generated with alwaysApply: true
    And components.mdc is generated with globs: ["**/*.tsx", "**/*.jsx"]
    And both contain relevant design system rules from DESIGN.md
```

#### US-23: Token Exports (CSS, JSON, Tailwind)
```gherkin
Feature: Token format exports
  As a user
  I want tokens exported in multiple formats
  So that I can integrate them into any project

  Scenario: tokens.css generated
    Given I export with tokens.css selected
    Then a valid CSS file with :root custom properties is generated
    And it includes semantic and primitive tokens

  Scenario: tokens.json generated
    Given I export with tokens.json selected
    Then a W3C DTCG compliant JSON file is generated
    And it includes $type, $value, $description fields

  Scenario: tailwind.config.js generated
    Given I export with Tailwind config selected
    Then a valid tailwind.config.js is generated
    And CSS variable references are mapped to theme.extend keys
```

### Epic 9: State Management & Persistence

#### US-24: Project State Management
```gherkin
Feature: Project state with Zustand
  As a developer
  I want centralised state management
  So that all panels stay in sync

  Scenario: State syncs across panels
    Given I modify a token in the Source panel
    Then the Editor panel reflects the change in DESIGN.md
    And the Test panel uses the updated context

  Scenario: State persists to localStorage
    Given I am working on a project
    When I close and reopen the browser
    Then my project data is restored from localStorage
    And the Studio loads with my previous state
```

### Epic 10: Design System & Polish

#### US-25: Studio Design System Implementation
```gherkin
Feature: Studio's own design system
  As a user
  I want the Studio itself to have a polished, professional design
  So that it demonstrates the quality AI Kits can achieve

  Scenario: Design tokens applied consistently
    Given the Studio is loaded
    Then all UI elements use the Studio design tokens:
      | Token | Value |
      | --bg-app | #0C0C0E |
      | --bg-panel | #111115 |
      | --bg-surface | #17171C |
      | --accent | #6366F1 |
      | --text-primary | #E8E8F0 |
      | --font | Geist, Inter, system |
    And the Geist font is loaded (local or Google Fonts)
    And all interactive elements have hover/focus states
    And transitions use 150ms ease-out for micro interactions
```

---

## 3. User Flows

### Flow 1: Figma Extraction
1. User lands on homepage
2. Pastes Figma file URL + PAT
3. Clicks "Extract Design System"
4. Sees progress screen with step-by-step updates
5. Redirected to Studio with DESIGN.md streaming into editor
6. Reviews tokens in Source panel, edits DESIGN.md
7. Tests prompts in Test panel
8. Exports AI Kit bundle

### Flow 2: Website Extraction
1. User lands on homepage
2. Pastes website URL
3. Clicks "Extract Design System"
4. Sees progress (Playwright loading, CSS extraction, screenshots)
5. Redirected to Studio with generated DESIGN.md
6. Reviews screenshots, tokens, and DESIGN.md
7. Tests and exports

---

## 4. Screens & UI

### Landing Page
- Dark themed hero with tagline: "Give your AI agent perfect taste."
- Single URL input field (auto-detects Figma vs website)
- Extract button
- Row of 6 AI Kit templates (Linear, Revolut, Stripe, Notion, Vercel, iOS)

### Extraction Progress
- Full-screen dark overlay
- Progress bar with percentage
- Step-by-step checklist with status icons
- Estimated time remaining
- Warning notes (e.g. Enterprise plan required for Variables)

### Studio (Three-Panel)
- Top bar: project name, save status, source badge, action buttons
- Left panel (Source): Tokens/Components/Screenshots tabs
- Centre panel (Editor): Monaco with DESIGN.md
- Right panel (Test): context toggle, prompt input, streaming output, health score

### Export Modal
- Format checkboxes with descriptions
- Preview of selected format
- Download button
- Token count estimate

---

## 5. Features (Phase 1 Scope)

| Feature | Priority | Status |
|---------|----------|--------|
| Three-panel resizable layout | P0 | Phase 1 |
| Figma styles extraction | P0 | Phase 1 |
| Figma components extraction | P0 | Phase 1 |
| Website CSS extraction | P0 | Phase 1 |
| Website screenshots | P0 | Phase 1 |
| Claude DESIGN.md synthesis | P0 | Phase 1 |
| Monaco editor with dark theme | P0 | Phase 1 |
| Token autocomplete | P1 | Phase 1 |
| Source panel (tokens, components, screenshots) | P0 | Phase 1 |
| AI test panel with streaming | P0 | Phase 1 |
| Basic health score | P1 | Phase 1 |
| Export: CLAUDE.md | P0 | Phase 1 |
| Export: tokens.css | P0 | Phase 1 |
| Export: tokens.json (W3C DTCG) | P1 | Phase 1 |
| Export: tailwind.config.js | P1 | Phase 1 |
| Export: Cursor rules (.mdc) | P1 | Phase 1 |
| ZIP bundle download | P0 | Phase 1 |
| localStorage persistence | P0 | Phase 1 |
| Figma rate limit handling | P0 | Phase 1 |

---

## 6. Architecture

```
Next.js 15 App (single deployment)
├── /app
│   ├── page.tsx                    # Landing page
│   ├── /studio/[id]/page.tsx       # Three-panel Studio
│   └── /api/
│       ├── /extract/figma/         # Figma extraction
│       ├── /extract/website/       # Website extraction (Playwright)
│       ├── /generate/design-md/    # Claude synthesis (streaming)
│       ├── /generate/test/         # Test panel Claude calls
│       └── /export/bundle/         # ZIP generation
├── /components
│   ├── /studio/                    # Studio-specific components
│   ├── /ui/                        # shadcn/ui components
│   └── /shared/                    # Shared components
├── /lib
│   ├── /figma/                     # Figma API client + parsers
│   ├── /website/                   # Playwright extraction
│   ├── /claude/                    # Anthropic SDK integration
│   ├── /export/                    # Format generators
│   ├── /store/                     # Zustand stores
│   └── /types/                     # TypeScript types
└── localStorage                    # Phase 1 persistence
```

---

## 7. System Design

### State Management
- Zustand for global state (project data, extraction state, editor content)
- localStorage adapter for persistence
- Optimistic updates with debounced persistence

### Streaming Architecture
- Anthropic SDK streaming for Claude responses
- ReadableStream API for SSE from API routes
- X-Accel-Buffering: no header for Nginx compatibility

### Extraction Pipeline
- Figma: Sequential API calls with rate limiting (100ms delay, batch 50 IDs)
- Website: Playwright headless Chromium with page.evaluate() for CSS extraction
- Both feed into normalised ExtractedData format

---

## 8. API Specifications

### POST /api/extract/figma
```typescript
// Request
{ figmaUrl: string; accessToken: string }
// Response (streaming progress via SSE)
{ type: 'step' | 'complete' | 'error'; step?: string; percent?: number; data?: ExtractionResult }
```

### POST /api/extract/website
```typescript
// Request
{ url: string }
// Response (streaming progress via SSE)
{ type: 'step' | 'complete' | 'error'; step?: string; percent?: number; data?: WebsiteExtractionResult }
```

### POST /api/generate/design-md
```typescript
// Request
{ extractionData: ExtractionResult }
// Response: text/plain streaming DESIGN.md content
```

### POST /api/generate/test
```typescript
// Request
{ prompt: string; designMd: string; includeContext: boolean }
// Response: text/plain streaming Claude response
```

### POST /api/export/bundle
```typescript
// Request
{ projectId: string; formats: ExportFormat[] }
// Response: application/zip (downloadable blob)
```

---

## 9. Data Model

```typescript
interface Project {
  id: string
  name: string
  sourceType: 'figma' | 'website' | 'manual'
  sourceUrl?: string
  designMd: string
  extractionData?: ExtractionResult
  tokenCount?: number
  healthScore?: number
  createdAt: string
  updatedAt: string
}

interface ExtractionResult {
  sourceType: 'figma' | 'website'
  tokens: {
    colors: ExtractedToken[]
    typography: ExtractedToken[]
    spacing: ExtractedToken[]
    radius: ExtractedToken[]
    effects: ExtractedToken[]
  }
  components: ExtractedComponent[]
  screenshots: string[] // base64 or blob URLs
  fonts: FontDeclaration[]
  animations: AnimationDefinition[]
  librariesDetected: Record<string, boolean>
  cssVariables: Record<string, string>
  computedStyles: Record<string, ComputedStyleMap>
}

interface ExtractedToken {
  name: string
  value: string
  type: 'color' | 'typography' | 'spacing' | 'radius' | 'effect'
  category: 'primitive' | 'semantic'
  cssVariable?: string
  description?: string
}

interface ExtractedComponent {
  name: string
  description?: string
  variantCount: number
  variants?: string[]
  properties?: Record<string, ComponentProperty>
}
```

---

## 10. Security

- Figma PAT: never stored, never logged — used only during extraction request
- No auth in Phase 1 (internal tool)
- API routes validate input with Zod schemas
- Playwright runs headless with no persistence
- No user data leaves the browser except via explicit API calls
- ANTHROPIC_API_KEY stored as environment variable only

---

## 11. Performance

- Figma extraction target: <60 seconds for typical file
- Website extraction target: <30 seconds
- DESIGN.md generation: streaming, first tokens appear within 2 seconds
- Monaco editor: lazy loaded via dynamic import (ssr: false)
- Export bundle generation: <5 seconds
- localStorage reads: synchronous, sub-millisecond

---

## 12. Scalability

Phase 1 is single-user, single-instance. Future phases will:
- Move to Supabase for multi-user persistence
- Extract Playwright to a separate microservice with BullMQ
- Add Redis caching for extraction results
- Implement CDN for exported bundles

---

## 13. Testing Strategy

- TypeScript strict mode (no `any`)
- `npm run typecheck` must pass on every story
- `npm run lint` must pass on every story
- Visual verification via dev-browser for frontend stories
- Manual testing against real Figma files and websites

---

## 14. Deployment

Phase 1: Local development (`npm run dev`)
Future: Coolify on Hetzner AX41-NVMe (116.202.170.188, 64GB RAM)

---

## 15. Maintenance

- Design tokens in globals.css as CSS custom properties
- shadcn/ui components managed via CLI
- Zustand stores colocated with features
- Conventional commits for version history
