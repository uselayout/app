import type { Metadata } from 'next';
import { LivePageClient } from '@/components/marketing/LivePageClient';

export const metadata: Metadata = {
  title: 'Layout Live — visually edit your real running app | Layout',
  description:
    'Layout Live is a macOS desktop app that turns your running React app into a canvas. Click an element, scrub its spacing, swap a colour for a design token — and the edit is written straight back to your Tailwind source. Download the free open alpha.',
  openGraph: {
    title: 'Layout Live — stop prompting for padding',
    description:
      'Click an element, scrub a value, and a deterministic edit is written to your source. The macOS app for visually editing your real running app. Free open alpha.',
  },
};

export default function LivePage() {
  return <LivePageClient />;
}
