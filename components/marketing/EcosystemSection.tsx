'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LAYOUT_UI_URL } from '@/lib/marketing/layout-ui';

/**
 * Compact bento for the secondary surfaces. Replaces the full-height
 * ExplorerSection, ExtensionSection, LayoutUISection and BrowseKitsCTA:
 * each gets a cell here and carries its depth on a dedicated page.
 */
const CELLS: Array<{
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  external?: boolean;
}> = [
  {
    eyebrow: 'Studio',
    title: 'Explorer',
    body: 'Generate up to six on-system variants of a component or page from one prompt, each scored for compliance. Push the winner to Figma or promote it to your library.',
    href: '/studio',
    cta: 'Open the Studio',
  },
  {
    eyebrow: 'Browser',
    title: 'Chrome extension',
    body: 'Extract design tokens from any live site in the sidebar, inspect elements against your system, and push straight to your Layout project. No tab-switching.',
    href: '/docs',
    cta: 'Read the docs',
  },
  {
    eyebrow: 'Open source',
    title: 'Layout UI',
    body: '54 shadcn-compatible components, 58 themes, one --layout-* token contract. Swap the kit and the whole system reskins with no component code changes.',
    href: LAYOUT_UI_URL,
    cta: 'Browse Layout UI',
    external: true,
  },
  {
    eyebrow: 'Community',
    title: 'Kit Gallery',
    body: 'Start from a community design system kit, or publish yours from the Studio with one click and install it anywhere from the CLI.',
    href: '/gallery',
    cta: 'Browse all kits',
  },
];

export function EcosystemSection() {
  return (
    <section className="bg-[var(--mkt-bg)] pt-[100px] lg:pt-[180px] flex flex-col items-center">
      <div className="max-w-[1280px] w-full px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="max-w-[640px] mb-10"
        >
          <h2 className="text-[32px] leading-[36px] md:text-[40px] md:leading-[44px] tracking-[-0.9px] font-normal text-[var(--mkt-text-primary)]">
            And the rest of the toolkit.
          </h2>
          <p className="mt-3 text-[16px] leading-[24px] text-[var(--mkt-text-secondary)]">
            Every surface reads the same extracted design system, so wherever the
            work happens, the output stays on-brand.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          {CELLS.map((cell) => {
            const inner = (
              <div className="flex h-full flex-col gap-3 rounded-[10px] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-6 transition-colors duration-150 hover:border-[var(--mkt-border-strong)] md:p-8">
                <p className="text-[12px] uppercase tracking-[1.2px] text-[var(--mkt-text-muted)]">
                  {cell.eyebrow}
                </p>
                <p className="text-[22px] leading-[28px] tracking-[-0.4px] text-[var(--mkt-text-primary)]">
                  {cell.title}
                </p>
                <p className="text-[15px] leading-[24px] text-[var(--mkt-text-secondary)] tracking-[-0.165px]">
                  {cell.body}
                </p>
                <p className="mt-auto pt-2 text-[15px] text-[var(--mkt-accent)]">
                  {cell.cta} →
                </p>
              </div>
            );
            return cell.external ? (
              <a
                key={cell.title}
                href={cell.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                {inner}
              </a>
            ) : (
              <Link key={cell.title} href={cell.href} className="block h-full">
                {inner}
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
