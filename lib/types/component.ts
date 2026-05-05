export type ComponentStatus = "draft" | "approved" | "deprecated";
export type ComponentSource = "manual" | "explorer" | "extraction" | "figma";

export interface ComponentProp {
  name: string;
  type: "string" | "number" | "boolean" | "enum";
  defaultValue?: string;
  required: boolean;
  options?: string[];
}

export interface ComponentVariant {
  name: string;
  description?: string;
  propOverrides: Record<string, string>;
}

export interface ComponentState {
  name: string;
  description?: string;
}

export type DesignType = "component" | "page";

/**
 * Edit schema — the JSON manifest the AI emits alongside generated TSX.
 *
 * The inspector drawer reads this to render form controls (token pickers,
 * text inputs, variant toggles) without ever parsing the TSX itself.
 * Each editable element in the TSX is tagged with `data-edit-id="<id>"`
 * matching an entry in `elements`.
 */
export interface EditSchema {
  /** Schema version — bump when the shape changes. */
  version: 1;
  elements: EditableElement[];
  /** Variant axes — e.g. { Size: ["sm","md","lg"], State: ["default","hover"] }. */
  variants?: Record<string, string[]>;
  /** Optional: imported component name this schema was generated from. */
  sourceComponentName?: string;
}

export interface EditableElement {
  /** Stable id matching `data-edit-id` on the rendered TSX. */
  id: string;
  /** Human label, e.g. "Button container", "Label". */
  label: string;
  props: EditableProp[];
}

export type EditableProp =
  | TokenProp
  | TextProp
  | EnumProp;

interface TokenPropBase {
  /** Property name as it appears in the rendered styles, e.g. "background", "padding". */
  key: string;
  /** Current value: a CSS variable reference like "--color-primary" (no var() wrapper). */
  value: string;
  /** Optional override list — defaults to all project tokens of this category. */
  allowedTokens?: string[];
}

export interface ColorTokenProp extends TokenPropBase {
  type: "color-token";
}
export interface SpacingTokenProp extends TokenPropBase {
  type: "spacing-token";
}
export interface RadiusTokenProp extends TokenPropBase {
  type: "radius-token";
}
export interface TypeTokenProp extends TokenPropBase {
  type: "type-token";
}
export interface ShadowTokenProp extends TokenPropBase {
  type: "shadow-token";
}

export type TokenProp =
  | ColorTokenProp
  | SpacingTokenProp
  | RadiusTokenProp
  | TypeTokenProp
  | ShadowTokenProp;

export interface TextProp {
  type: "text";
  key: string;
  value: string;
}

export interface EnumProp {
  type: "enum";
  key: string;
  value: string;
  options: string[];
}

export interface Component {
  id: string;
  orgId: string;
  projectId: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  tags: string[];
  code: string;
  compiledJs: string | null;
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: ComponentState[];
  tokensUsed: string[];
  status: ComponentStatus;
  version: number;
  createdBy: string | null;
  source: ComponentSource | null;
  designType: DesignType;
  /** Edit schema for token-driven form editing. Populated by AI generation. */
  editSchema: EditSchema | null;
  /** When `source === "figma"`, the imported component name this is linked to. */
  linkedComponentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentVersion {
  id: string;
  componentId: string;
  version: number;
  code: string;
  props: ComponentProp[];
  variants: ComponentVariant[];
  states: ComponentState[];
  changedBy: string | null;
  changeSummary: string | null;
  createdAt: string;
}
