// Regex that matches the CORE TOKENS fenced CSS block in a layout.md document.
//
// Historically multiple producers wrote this block with different decorators:
// Claude synthesis uses equals signs, the curated sync uses em-dashes, and
// hand-authored documents sometimes use hyphens or no decorators. A strict
// regex silently dropped assignments when it failed to match, so this tolerant
// form accepts any combination of em-dash, equals, or hyphen decorators
// (including none) around the CORE TOKENS label.
//
// Temporary: lives alongside the regex-driven layout.md editing model and is
// retired when the derived-artefact architecture lands (layout.md generated
// on each read, no regex editing).
export const CORE_TOKENS_BLOCK_REGEX =
  /```css\s*\n\/\*\s*[─=-]*\s*CORE TOKENS[\s\S]*?```/;

// Same match, captured in two groups so callers can splice in new declarations
// before the closing fence: (openingThroughBody)(newlinePlusClosingFence).
export const CORE_TOKENS_BLOCK_SPLIT_REGEX =
  /(```css\s*\n\/\*\s*[─=-]*\s*CORE TOKENS[\s\S]*?)(\n```)/;
