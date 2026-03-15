'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';

const NAV_LINKS = [
  { label: 'Products', href: '#products' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Figma Loop', href: '#figma-loop' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
  { label: 'Contact', href: '#contact' },
];

function handleAnchorClick(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
  if (!href.startsWith('#')) return;
  const el = document.querySelector(href);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth' });
}

export function MarketingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--mkt-bg)] border-b border-[var(--mkt-border)]">
      <div className="max-w-[1280px] mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <img
            src="/marketing/logo.svg"
            alt="Layout"
            width={99}
            height={24}
            className="flex-shrink-0"
          />
        </Link>

        {/* Nav — desktop */}
        <nav className="hidden lg:flex items-center">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleAnchorClick(e, link.href)}
              className="px-3 text-[13px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right actions — desktop */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => signOut()}
                className="text-[13px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
              >
                Log out
              </button>
              <div className="w-px h-[16px] bg-[#23252a]" aria-hidden="true" />
              <Link
                href="/studio"
                className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[13px] h-[32px] px-[13px] rounded-[4px] font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity duration-150"
              >
                Open Studio →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
              >
                Log in
              </Link>
              <div className="w-px h-[16px] bg-[#23252a]" aria-hidden="true" />
              <Link
                href="/login"
                className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[13px] h-[32px] px-[13px] rounded-[4px] font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity duration-150"
              >
                Get started →
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="lg:hidden flex items-center justify-center w-10 h-10"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 2L18 18M18 2L2 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M2 5H18M2 10H18M2 15H18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-[var(--mkt-border)] bg-[var(--mkt-bg)] px-6 py-4 flex flex-col gap-4">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { handleAnchorClick(e, link.href); setMenuOpen(false); }}
                className="text-[15px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="border-t border-[var(--mkt-border)] pt-4 flex flex-col gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="text-left text-[15px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
                >
                  Log out
                </button>
                <Link
                  href="/studio"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[15px] h-[40px] px-[17px] rounded-[4px] font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity duration-150"
                >
                  Open Studio →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-[15px] text-[var(--mkt-text-secondary)] hover:text-white transition-colors duration-150"
                >
                  Log in
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center bg-[var(--mkt-btn-primary-bg)] text-[var(--mkt-btn-primary-text)] text-[15px] h-[40px] px-[17px] rounded-[4px] font-medium shadow-[0px_1px_2px_0px_rgba(0,0,0,0.12)] hover:opacity-90 transition-opacity duration-150"
                >
                  Get started →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
