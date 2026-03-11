# Changelog

All notable changes to SuperDuper AI Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
