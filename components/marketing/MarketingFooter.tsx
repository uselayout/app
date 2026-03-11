interface MarketingFooterProps {
  isLoggedIn: boolean;
  onSignOut: () => void;
  scrollTo: (id: string) => void;
}

const NAV_LINKS = [
  { label: "Products", id: "products" },
  { label: "How it Works", id: "how-it-works" },
  { label: "AI Kits", id: "ai-kits" },
  { label: "Figma Loop", id: "figma-loop" },
];

const HREF_LINKS = [{ label: "Docs", href: "/docs" }];

export function MarketingFooter({
  isLoggedIn,
  onSignOut,
  scrollTo,
}: MarketingFooterProps) {
  return (
    <footer className="bg-[#0a0a0a] px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo + tagline */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-indigo-400"
              >
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm font-semibold">
                SuperDuper
              </span>
            </div>
            <p className="text-sm text-gray-500">The compiler between design systems and AI coding agents.</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-6">
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(id);
                }}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {label}
              </button>
            ))}
            {HREF_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
            {isLoggedIn ? (
              <button
                onClick={onSignOut}
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Sign out
              </button>
            ) : (
              <a
                href="/login"
                className="text-sm text-gray-500 hover:text-white transition-colors"
              >
                Sign in
              </a>
            )}
          </nav>
        </div>

        <div className="mt-14 border-t border-white/[0.06] pt-8">
          <p className="text-xs text-gray-600">
            © 2026 SuperDuper
          </p>
        </div>
      </div>
    </footer>
  );
}
