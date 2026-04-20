// ─── AI Provider / Model ─────────────────────────────────────────────────────
//
// The canonical model registry lives in the `layout_ai_models` DB table,
// managed via the admin panel. See lib/ai/models.ts for the async API.
//
// The synchronous constants below are kept for backwards compat and as
// fallbacks when the DB is unreachable.
// ─────────────────────────────────────────────────────────────────────────────

export type AiProvider = "claude" | "gemini";

export interface AiModelDef {
  id: string;
  label: string;
  provider: AiProvider;
  maxOutputTokens: number;
}

/** Synchronous fallback model map. Prefer lib/ai/models.ts async API in new code. */
export const AI_MODELS: Record<string, AiModelDef> = {
  "claude-sonnet-4-6": {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "claude",
    maxOutputTokens: 64_000,
  },
  "claude-opus-4-7": {
    id: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    provider: "claude",
    maxOutputTokens: 128_000,
  },
  "gemini-3.1-pro-preview": {
    id: "gemini-3.1-pro-preview",
    label: "Gemini 3.1 Pro",
    provider: "gemini",
    maxOutputTokens: 65_536,
  },
};

/**
 * Models that require the user to provide their own API key (BYOK).
 * Synchronous fallback. Prefer `isModelByokOnly()` from lib/ai/models.ts.
 */
export const BYOK_ONLY_MODELS: ReadonlySet<string> = new Set([
  "gemini-3.1-pro-preview",
]);

/** Model ID type. Now a string to support DB-managed models. */
export type AiModelId = string;

export const DEFAULT_EXPLORE_MODEL: AiModelId = "claude-sonnet-4-6";

// ─── Source / Token ──────────────────────────────────────────────────────────

export type SourceType = "figma" | "website" | "manual";

export type TokenType = "color" | "typography" | "spacing" | "radius" | "effect" | "motion";

export type TokenCategory = "primitive" | "semantic";

export type ExportFormat =
  | "claude-md"
  | "cursor-rules"
  | "agents-md"
  | "tokens-css"
  | "tokens-json"
  | "tailwind-config";

export type ExtractionStepStatus = "pending" | "running" | "complete" | "failed";

export type ExtractionStatus =
  | "idle"
  | "pending"
  | "running"
  | "complete"
  | "failed"
  | "partial";

export interface ExtractedToken {
  name: string;
  value: string;
  type: TokenType;
  category: TokenCategory;
  cssVariable?: string;
  description?: string;
  groupName?: string;
  /** Original name before extraction renamed it (e.g. mined radius tokens). */
  originalName?: string;
  /** Mode name for multi-mode tokens (e.g. "light", "dark"). */
  mode?: string;
  /** Alias reference: if this token references another, e.g. "var(--primitive-red-400)". */
  reference?: string;
  /** Standard role key from Layout's canonical schema (e.g. "bg-app", "accent", "error"). */
  standardRole?: string;
  /** Standard CSS variable name: --{kit}-{role} (e.g. "--ada-bg-app"). */
  standardName?: string;
  /** Confidence of the standard role assignment. */
  standardConfidence?: "high" | "medium" | "low";
  /** CSS variable names of other tokens that resolved to the same value at extraction time. Populated by lib/extraction/dedupe.ts. */
  aliases?: string[];
}

export interface ComponentProperty {
  type: "BOOLEAN" | "TEXT" | "VARIANT" | "INSTANCE_SWAP";
  defaultValue?: string;
  preferredValues?: string[];
}

export interface ExtractedComponent {
  name: string;
  description?: string;
  variantCount: number;
  variants?: string[];
  properties?: Record<string, ComponentProperty>;
}

export interface ScannedComponent {
  /** Component name (PascalCase) */
  name: string;
  /** File path relative to project root */
  filePath: string;
  /** Whether it's a default or named export */
  exportType: "default" | "named";
  /** Props interface/type name if found */
  propsType?: string;
  /** Extracted prop names */
  props: string[];
  /** Whether it uses forwardRef */
  usesForwardRef: boolean;
  /** Import path for code usage */
  importPath: string;
  /** Source: storybook story or codebase scan */
  source: "storybook" | "codebase";
  /** Storybook story names (if from storybook) */
  stories?: string[];
  /** Storybook arg types (if from storybook) */
  args?: Array<{
    name: string;
    type?: string;
    defaultValue?: string;
    options?: string[];
  }>;
  /** Match against Figma design system component */
  designSystemMatch?: string;
  /** Match confidence 0-1 */
  matchConfidence?: number;
}

export interface FontDeclaration {
  family: string;
  src?: string;
  weight: string;
  style: string;
  display: string;
}

export type FontFormat = "woff2" | "woff" | "ttf" | "otf";

export interface UploadedFont {
  id: string;
  family: string;
  weight: string;
  style: string;
  format: FontFormat;
  url: string;
  projectId: string;
  orgId?: string;
}

export interface AnimationDefinition {
  name: string;
  cssText: string;
}

export interface ComputedStyleMap {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  padding?: string;
  border?: string;
  boxShadow?: string;
  transition?: string;
  // Layout
  display?: string;
  flexDirection?: string;
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  margin?: string;
  // Text
  textAlign?: string;
  textTransform?: string;
  textDecoration?: string;
}

export interface ExtractedTokens {
  colors: ExtractedToken[];
  typography: ExtractedToken[];
  spacing: ExtractedToken[];
  radius: ExtractedToken[];
  effects: ExtractedToken[];
  motion: ExtractedToken[];
}

export interface ExtractionResult {
  sourceType: SourceType;
  sourceName: string;
  sourceUrl?: string;
  /** Where the extraction originated — drives confidence classification in synthesis. */
  extractionSource?: "figma" | "website";
  tokens: ExtractedTokens;
  components: ExtractedComponent[];
  screenshots: string[];
  fonts: FontDeclaration[];
  animations: AnimationDefinition[];
  librariesDetected: Record<string, boolean>;
  cssVariables: Record<string, string>;
  computedStyles: Record<string, ComputedStyleMap>;
  interactiveStates?: Record<string, Record<string, string>>;
  buttonColourCensus?: Record<string, { count: number; elements: Array<{ tag: string; text: string; area: number; color: string }> }>;
  breakpoints?: string[];
  warnings?: string[];
  layoutPatterns?: Array<{
    direction: string;
    mainAxis: string;
    crossAxis: string;
    count: number;
  }>;
  /**
   * Tokens filtered out by lib/extraction/noise.ts (vendor libs, alpha-tint
   * primitives). Kept here so users can inspect what was dropped and
   * re-include anything they actually want.
   */
  droppedNoise?: Array<{ name: string; value: string; type: TokenType; reason: "vendor" | "alpha-tint" | "other" }>;
}

export interface ExtractionStep {
  id: string;
  label: string;
  status: ExtractionStepStatus;
  detail?: string;
  progress?: number;
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  sourceType: SourceType;
  sourceUrl?: string;
  layoutMd: string;
  extractionData?: ExtractionResult;
  tokenCount?: number;
  healthScore?: number;
  explorations?: ExplorationSession[];
  iconPacks?: string[];
  uploadedFonts?: UploadedFont[];
  pendingCanvasImage?: string | null;
  pluginTokensPushedAt?: string;
  scannedComponents?: ScannedComponent[];
  scanSource?: "cli" | "github";
  lastScanAt?: string;
  githubRepo?: string;
  /** Standardisation data: kit prefix, role assignments, unassigned tokens */
  standardisation?: ProjectStandardisation;
  /** Design system snapshots for rollback (max 5) */
  snapshots?: DesignSystemSnapshot[];
  /** Brand logos, wordmarks, favicons uploaded by the user */
  brandingAssets?: BrandingAsset[];
  /** Project-scoped context documents attached to every variant generation */
  contextDocuments?: ContextDocument[];
  createdAt: string;
  updatedAt: string;
}

/** Slots a branding asset can occupy. Informs the `data-brand-logo` attribute Claude emits. */
export type BrandingSlot =
  | "primary"
  | "secondary"
  | "wordmark"
  | "favicon"
  | "mark"
  | "other";

/**
 * Context variant for a brand asset. A single brand typically has several
 * visual treatments of the same logo (full colour, white for dark surfaces,
 * black for mono prints). The generator picks the right variant at runtime
 * based on the surface the logo is placed on.
 */
export type BrandingVariant = "colour" | "white" | "black" | "mono";

export interface BrandingAsset {
  id: string;
  slot: BrandingSlot;
  /** Defaults to "colour" for existing records written before variants shipped. */
  variant?: BrandingVariant;
  url: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ContextDocument {
  id: string;
  name: string;
  content: string;
  mimeType: string;
  size: number;
  addedAt: string;
  pinned?: boolean;
}

/** Serialisable version of StandardisedTokenMap for project storage */
export interface ProjectStandardisation {
  kitPrefix: string;
  /**
   * Role assignments keyed by `roleKey` for default / light mode, and by
   * `${roleKey}::${mode}` (e.g. "bg-app::dark") for non-default modes.
   * Use `lib/tokens/assignment-key.ts::assignmentKey(roleKey, mode)` rather
   * than concatenating by hand.
   */
  assignments: Record<string, {
    roleKey: string;
    /** Non-default mode, e.g. "dark". Omitted for the light / default mode. */
    mode?: string;
    originalName: string;
    originalCssVariable?: string;
    value: string;
    standardName: string;
    confidence: "high" | "medium" | "low";
    userConfirmed: boolean;
  }>;
  /** Tokens not assigned to any standard role */
  unassigned: {
    name: string;
    cssVariable?: string;
    value: string;
    type: string;
    hidden: boolean;
  }[];
  /** Auto-generated anti-patterns */
  antiPatterns: {
    rule: string;
    reason: string;
    fix: string;
  }[];
  /** Rule strings of anti-patterns the user has dismissed; hidden from the curated view until re-standardisation. */
  dismissedAntiPatterns?: string[];
  /** When the standardisation was last run */
  standardisedAt: string;
}

export interface DesignSystemSnapshot {
  id: string;
  label: string;
  tokens: ExtractedTokens;
  layoutMd: string;
  healthScore?: number;
  tokenCount: number;
  standardisation?: ProjectStandardisation;
  createdAt: string;
}

export interface HealthScore {
  total: number;
  tokenFaithfulness: number;
  componentAccuracy: number;
  antiPatternViolations: number;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: "error" | "warning";
  rule: string;
  actual: string;
  expected: string;
}

// ─── Design Explorer ──────────────────────────────────────────────────────────

export interface ComparisonResult {
  id: string;
  prompt: string;
  sourceVariantId?: string;
  withDs: DesignVariant;
  withoutDs: DesignVariant;
  createdAt: string;
}

export interface ExplorationSession {
  id: string;
  projectId: string;
  prompt: string;
  variantCount: number;
  variants: DesignVariant[];
  selectedVariantId?: string;
  referenceImage?: string;
  contextFiles?: ContextFile[];
  comparisons?: ComparisonResult[];
  createdAt: string;
  /** Set when generation starts; cleared on completion. Used to detect interrupted generation. */
  generatingBatchId?: string;
  /** How many variants were requested for the active batch. */
  generatingBatchExpected?: number;
}

export interface ContextFile {
  name: string;
  content: string;
}

export interface DesignVariant {
  id: string;
  name: string;
  rationale: string;
  code: string;
  compiledJs?: string;
  healthScore?: HealthScore;
  rating?: "up" | "down";
  figmaPush?: FigmaPushRecord;
  figmaImport?: FigmaImportRecord;
  batchId?: string;
  batchPrompt?: string;
  editHistory?: EditHistory;
}

export interface FigmaPushRecord {
  fileKey: string;
  nodeId: string;
  pushedAt: string;
  viewports: string[];
}

export interface FigmaImportRecord {
  importedAt: string;
  changes: FigmaChange[];
  screenshot?: string;
}

export interface FigmaChange {
  type: "colour" | "typography" | "spacing" | "layout" | "content";
  property: string;
  before: string;
  after: string;
  designTokenMatch?: string;
  accepted: boolean;
}

// ─── Visual Editor (Element Inspector) ──────────────────────────────────────

export interface StyleEdit {
  elementId: string;
  elementTag: string;
  elementClasses: string;
  property: string;
  before: string;
  after: string;
  tokenMatch?: string;
}

export interface ElementAnnotation {
  elementId: string;
  elementTag: string;
  note: string;
  rect: { x: number; y: number; width: number; height: number };
}

export type EditEntryType = "manual" | "ai-annotation" | "ai-refine" | "rollback";

export interface EditEntry {
  id: string;
  timestamp: string;
  type: EditEntryType;
  description: string;
  codeBefore: string;
  codeAfter: string;
  styleChanges?: StyleEdit[];
  annotations?: ElementAnnotation[];
}

export type EditHistory = EditEntry[];
