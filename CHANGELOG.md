# Changelog

All notable changes to Layout will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-03-15

### Added
- New Project button on projects page with NewExtractionModal
- Reusable ConfirmModal component replacing browser confirm() dialogs
- AI chat bar in CreateComponentModal for AI-assisted component creation and editing

### Fixed
- Project deletion now updates UI immediately without requiring page refresh

## [0.2.0] - 2026-03-14

### Added
- Explorer Canvas for AI-powered design exploration with multi-variant generation (2-6 variants)
- Image upload support in Explorer (paste, drag-drop, file picker) for reference-based generation
- Variant refinement — select and refine individual variants with follow-up prompts
- Comparison view — A/B test component generation with vs without design system context
- Promote to Library — save Explorer variants directly to org component library
- Submit Candidate — submit variants for team review
- Push to Design System — batch update tokens and components from Explorer
- DESIGN.md quality scoring (Completeness Panel) across 6 weighted categories
- Extraction diff modal — visual diff on re-extraction with accept/discard workflow
- Component library with create, edit, version, and AI-assisted editing per organisation
- Template publishing — publish design systems as reusable templates
- Template browse and install — public gallery with search and one-click install
- Design drift detection dashboard
- Usage analytics dashboard
- Candidates review page for submitted design variants
- Icon library, typography explorer, and token browser dashboard pages
- Settings pages: API keys, audit log, templates, webhooks
- Organisation model with multi-user teams and roles (owner, admin, member)
- Better Auth integration (email/password + OAuth)
- Figma webhook receiver for FILE_UPDATE events with per-org passcode verification
- GitHub auto-PR creation via Git Data API (no local clone required)
- Webhook settings UI for Figma endpoint and GitHub repository configuration
- Section-level MCP queries (get_design_section tool)
- Component with context MCP queries (get_component_with_context tool)
- Enhanced list_components MCP tool with metadata, tags, and token usage
- MCP server now exposes 7 tools total

## [0.1.0] - 2026-03-11

### Added

- Website extraction via Playwright (CSS variables, computed styles, fonts, screenshots)
- Figma extraction via REST API (styles, components, variables)
- DESIGN.md synthesis using Claude Sonnet 4.6
- Three-panel Studio layout (Source, Editor, Test)
- Test panel with live component preview
- Export bundles (DESIGN.md, CLAUDE.md, .cursorrules, tokens.css, tokens.json, tailwind.config.js)
- Project management with Supabase persistence
- Authentication via Better Auth
- BYOK (Bring Your Own Key) support for Anthropic API
