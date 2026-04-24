"use client";

import { useEffect } from "react";

// Applies the persisted `layout-gallery-theme` (set by GalleryPageClient) to
// <html data-mkt-theme="..."> so every gallery-adjacent page (detail views,
// future /gallery/authors etc.) honours the same toggle without each page
// owning its own state.
export function GalleryThemeInit() {
  useEffect(() => {
    const saved = localStorage.getItem("layout-gallery-theme");
    const theme = saved === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-mkt-theme", theme);
    return () => {
      document.documentElement.removeAttribute("data-mkt-theme");
    };
  }, []);
  return null;
}
