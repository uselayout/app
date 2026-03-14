export type IconSource = "upload" | "figma" | "library";

export interface DesignIcon {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  category: string;
  tags: string[];
  svg: string;
  viewbox: string;
  sizes: number[];
  strokeWidth: number;
  source: IconSource | null;
  libraryName: string | null;
  createdAt: string;
  updatedAt: string;
}
