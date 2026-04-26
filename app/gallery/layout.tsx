import type { ReactNode } from "react";
import Script from "next/script";

const THEME_SCRIPT =
  "(function(){try{var t=localStorage.getItem('layout-gallery-theme');document.documentElement.setAttribute('data-mkt-theme',t==='dark'?'dark':'light');}catch(e){}})();";

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Script id="gallery-theme-init" strategy="beforeInteractive">
        {THEME_SCRIPT}
      </Script>
      {children}
    </>
  );
}
