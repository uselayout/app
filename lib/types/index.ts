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
  name: string;
  sourceType: SourceType;
  sourceUrl?: string;
  designMd: string;
  extractionData?: ExtractionResult;
  tokenCount?: number;
  healthScore?: number;
  testResults?: TestResult[];
  createdAt: string;
  updatedAt: string;
}

export interface TestResult {
  id: string;
  prompt: string;
  output: string;
  includeContext: boolean;
  healthScore?: HealthScore;
  rating?: "up" | "down";
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
