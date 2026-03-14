export interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  longDescription: string | null;
  sourceOrgId: string;
  previewImage: string | null;
  category: string;
  tags: string[];
  tokenCount: number;
  componentCount: number;
  typefaceCount: number;
  iconCount: number;
  forkCount: number;
  isFree: boolean;
  priceCents: number;
  isPublished: boolean;
  publishedAt: string | null;
  featured: boolean;
  authorName: string | null;
  authorUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplatePreview extends Template {
  tokens: {
    colors: number;
    spacing: number;
    typography: number;
    radius: number;
    effects: number;
  };
  componentNames: string[];
  typefaceNames: string[];
}
