export type SourceType = "figma" | "website" | "manual";

export type TokenType = "color" | "typography" | "spacing" | "radius" | "effect";

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

export interface FontDeclaration {
  family: string;
  src?: string;
  weight: string;
  style: string;
  display: string;
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
}

export interface ExtractedTokens {
  colors: ExtractedToken[];
  typography: ExtractedToken[];
  spacing: ExtractedToken[];
  radius: ExtractedToken[];
  effects: ExtractedToken[];
}

export interface ExtractionResult {
  sourceType: SourceType;
  sourceName: string;
  sourceUrl?: string;
  tokens: ExtractedTokens;
  components: ExtractedComponent[];
  screenshots: string[];
  fonts: FontDeclaration[];
  animations: AnimationDefinition[];
  librariesDetected: Record<string, boolean>;
  cssVariables: Record<string, string>;
  computedStyles: Record<string, ComputedStyleMap>;
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
  designMd: string;
  extractionData?: ExtractionResult;
  tokenCount?: number;
  healthScore?: number;
  explorations?: ExplorationSession[];
  createdAt: string;
  updatedAt: string;
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
