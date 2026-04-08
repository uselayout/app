export type ChangelogProduct =
  | "studio"
  | "cli"
  | "figma-plugin"
  | "chrome-extension";

export type ChangelogCategory = "new" | "improved" | "fixed";

/** Individual draft item added by Claude during the week */
export interface ChangelogEntry {
  /** Unique slug, e.g. "2026-w13-explorer-image-gen" */
  id: string;
  /** User-facing title */
  title: string;
  /** 1-2 sentence description in plain language */
  description: string;
  product: ChangelogProduct;
  category: ChangelogCategory;
  /** ISO date string (YYYY-MM-DD) when the change shipped */
  date: string;
}

/** Single bullet item in a published weekly entry */
export interface ChangelogItem {
  text: string;
  product: ChangelogProduct;
  category: ChangelogCategory;
}

/** Published changelog entry (one per publish date) */
export interface ChangelogWeek {
  /** Date identifier, e.g. "2026-04-08" (or legacy "2026-W13") */
  weekId: string;
  /** Human label, e.g. "8 April 2026" */
  label: string;
  /** Short prose intro (1-2 sentences) */
  summary: string;
  /** Bullet items grouped by product when rendered */
  items: ChangelogItem[];
}
