export type DesignTokenType = "color" | "typography" | "spacing" | "radius" | "effect" | "motion";

export type DesignTokenCategory = "primitive" | "semantic" | "component";

export type DesignTokenSource = "extracted" | "manual" | "figma-variable";

export interface DesignToken {
  id: string;
  orgId: string;
  projectId: string | null;
  name: string;
  slug: string;
  cssVariable: string | null;
  type: DesignTokenType;
  category: DesignTokenCategory;
  value: string;
  resolvedValue: string | null;
  groupName: string | null;
  sortOrder: number;
  description: string | null;
  source: DesignTokenSource | null;
  createdAt: string;
  updatedAt: string;
}
