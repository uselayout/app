const LAYOUT_LINKS = [
  { label: "home", href: "/" },
  { label: "pricing", href: "/pricing" },
  { label: "docs", href: "/docs" },
  { label: "changelog", href: "/changelog" },
];

const TOOLS_LINKS = [
  { label: "Studio", href: "/studio" },
  { label: "Layout CLI", href: "/docs/cli" },
  { label: "AI Kits", href: "/docs/kits" },
];

const SOCIALS_LINKS = [
  { label: "GitHub", href: "https://github.com/uselayout/cli" },
  { label: "Slack", href: "/slack" },
  { label: "X / Twitter", href: "https://x.com/uselayout" },
];

function LinkColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-extrabold uppercase tracking-[1.2px] text-[#e6e6e6]">
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {links.map(({ label, href }) => (
          <li key={href}>
            <a
              href={href}
              className="text-sm leading-5 text-white hover:text-white/80 transition-colors"
              {...(href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="sticky bottom-0 z-0 relative h-[700px] lg:h-[1100px] overflow-hidden bg-[var(--mkt-bg)]">
      {/* Gradient overlay at top for smooth transition */}
      <img
        src="/marketing/footer-gradient.webp"
        alt=""
        aria-hidden="true"
        className="absolute top-[-10px] left-0 w-full h-[170px] object-cover pointer-events-none z-20"
      />

      {/* Aurora background */}
      <img
        src="/marketing/aurora-footer.webp"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[841px] object-cover pointer-events-none"
      />

      {/* Dark-to-transparent gradient over aurora top edge */}
      <div
        className="absolute left-0 w-full h-[300px] pointer-events-none"
        style={{
          bottom: 841,
          background:
            "linear-gradient(to bottom, #080705, transparent)",
        }}
      />

      {/* Footer content */}
      <div className="relative z-10 px-6 pt-[240px] lg:pt-[400px]">
        <div className="mx-auto max-w-[1280px]">
          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Links row */}
          <div className="flex flex-col gap-10 pt-12 lg:pt-[96px] lg:flex-row lg:justify-between">
            <div className="flex flex-wrap gap-12 lg:gap-24">
              <LinkColumn title="Layout" links={LAYOUT_LINKS} />
              <LinkColumn title="Tools" links={TOOLS_LINKS} />
              <LinkColumn title="Socials" links={SOCIALS_LINKS} />
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-start lg:items-end justify-end">
              <p className="text-sm leading-5 text-white">© 2026 Layout</p>
            </div>
          </div>
        </div>
      </div>

      {/* Large LAYOUT wordmark */}
      <img
        src="/marketing/footer-wordmark.svg"
        alt=""
        aria-hidden="true"
        className="absolute bottom-0 left-0 w-full pointer-events-none select-none z-10"
      />
    </footer>
  );
}
