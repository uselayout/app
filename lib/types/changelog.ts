export type ChangelogProduct =
  | "studio"
  | "cli"
  | "figma-plugin"
  | "chrome-extension";

export type ChangelogCategory = "new" | "improved" | "fixed";

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

export interface ChangelogWeek {
  /** ISO week identifier, e.g. "2026-W13" */
  weekId: string;
  /** Human label, e.g. "Week of 24 March 2026" */
  label: string;
  entries: ChangelogEntry[];
}
