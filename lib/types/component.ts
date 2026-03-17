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
