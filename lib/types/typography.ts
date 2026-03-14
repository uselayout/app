export type TypefaceSource = "google" | "custom" | "system" | "extracted";
export type TypefaceRole = "heading" | "body" | "mono" | "display" | "accent";

export interface Typeface {
  id: string;
  orgId: string;
  family: string;
  source: TypefaceSource | null;
  googleFontsUrl: string | null;
  weights: string[];
  role: TypefaceRole | null;
  createdAt: string;
  updatedAt: string;
}

export interface TypeScale {
  id: string;
  orgId: string;
  typefaceId: string;
  name: string;
  slug: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string | null;
  sortOrder: number;
}
