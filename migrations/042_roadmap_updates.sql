-- Roadmap audit: mark shipped items, add missing shipped features, add new planned/considering items
-- Based on codebase audit (2026-04-08) and market research

-- ============================================
-- STEP 1: Mark existing items as shipped
-- ============================================

-- Theme and mode extraction - fully implemented (multi-mode tokens, Figma Variables, light/dark export)
UPDATE layout_roadmap_item
SET status = 'shipped', updated_at = now()
WHERE id = 'bde8f818-eb36-4e1e-a42f-301baf00c1d9';

-- ============================================
-- STEP 2: Add shipped features not on roadmap
-- ============================================

INSERT INTO layout_roadmap_item (title, description, product, status, sort_order) VALUES
  ('Codebase component scanner', 'Scan your codebase for React, Vue, and Svelte components. Integrates with GitHub webhooks for automatic updates.', 'studio', 'shipped', 1),
  ('AI-powered design exploration', 'Generate 2-6 component variants simultaneously with refinement, comparison, and health scoring.', 'studio', 'shipped', 2),
  ('Push to Figma', 'Push generated designs to Figma as native, editable objects with proper layer structure.', 'studio', 'shipped', 3),
  ('Figma Variables extraction', 'Extract and sync Figma Variables including modes, aliases, and collections.', 'studio', 'shipped', 4),
  ('Motion and gradient token extraction', 'Extract CSS animations, transitions, and gradient tokens from Figma files and websites.', 'studio', 'shipped', 5),
  ('10-dimension quality scoring', 'Analyse layout.md quality across colours, typography, spacing, components, anti-patterns, and more.', 'studio', 'shipped', 6),
  ('Custom font uploads', 'Upload and manage custom fonts for use in design exploration and preview.', 'studio', 'shipped', 7),
  ('Layout.md version history', 'Track changes to your layout.md over time with full version history.', 'studio', 'shipped', 8),
  ('Automatic re-extraction on Figma changes', 'Figma webhook integration triggers automatic re-extraction when your design file changes.', 'studio', 'shipped', 9),
  ('Public changelog with voting', 'Public changelog page with community voting on shipped features.', 'studio', 'shipped', 10),
  ('Billing and credit system', 'Stripe-powered billing with per-generation credits, subscription tiers, and top-ups.', 'studio', 'shipped', 11),
  ('13 MCP tools', 'Full MCP server with 13 tools including get-design-system, preview, push-to-figma, check-compliance, and more.', 'cli', 'shipped', 1),
  ('AGENTS.md export format', 'Export your design system context as AGENTS.md for universal AI agent compatibility.', 'cli', 'shipped', 2),
  ('Storybook integration', 'Import Storybook component manifests and merge with your design system context.', 'studio', 'shipped', 12);

-- ============================================
-- STEP 3: Add new planned items (Tier 1)
-- ============================================

INSERT INTO layout_roadmap_item (title, description, product, status, sort_order) VALUES
  ('Compliance score in MCP responses', 'Every AI generation returns a compliance score showing token usage, component reuse, and anti-pattern violations.', 'cli', 'planned', 1),
  ('Post-generation validation agent', 'MCP tool that validates AI-generated code against your component inventory and design tokens.', 'cli', 'planned', 2),
  ('One-command setup wizard', 'Single npx command that detects your Figma file, extracts tokens, generates layout.md, and installs MCP servers.', 'cli', 'planned', 3),
  ('Continuous sync and watch mode', 'File watcher and webhook listener that automatically regenerates layout.md when your design system changes.', 'cli', 'planned', 4);

-- ============================================
-- STEP 4: Add new considering items (Tier 2)
-- ============================================

INSERT INTO layout_roadmap_item (title, description, product, status, sort_order) VALUES
  ('Design system health dashboard', 'Track token adoption, component reuse, and compliance trends over time. Prove design system ROI.', 'studio', 'considering', 1),
  ('Framework-specific component output', 'Generate React, Vue, Svelte, or Angular components directly from your design system.', 'studio', 'considering', 2),
  ('Copilot instructions export', 'Export your design system as .github/copilot-instructions.md for GitHub Copilot compatibility.', 'cli', 'considering', 1),
  ('Design system analytics', 'Token usage rates, component adoption metrics, and drift detection over time.', 'studio', 'considering', 3),
  ('Team collaboration on layout.md', 'Real-time collaborative editing, commenting, and approval workflows for layout.md.', 'studio', 'considering', 4);
