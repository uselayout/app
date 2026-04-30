'use client';

import type { ReactNode } from 'react';

interface MockFrameProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * Wraps a Studio mock with a defining outer ring + drop shadow so the
 * window stands out against the marketing page background. Mirrors the
 * "macOS window over a desktop" feel — a 1px bright top edge, slight
 * inner highlight, and a soft outer shadow give the mock the depth a
 * naked dark-on-dark panel can't get.
 */
export function MockFrame({ children, ariaLabel, className }: MockFrameProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-[8px] ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
      style={{
        // 1px brighter outer ring + 1px inner top highlight + soft drop shadow.
        // Outer ring is bumped (0.28) so the window edge clearly separates from
        // the dark page bg even when the section's aurora glow is subtle.
        boxShadow: [
          '0 0 0 1px rgba(255,255,255,0.28)',
          'inset 0 1px 0 rgba(255,255,255,0.12)',
          '0 24px 56px -12px rgba(0,0,0,0.6)',
          '0 4px 14px -2px rgba(0,0,0,0.45)',
        ].join(', '),
      }}
    >
      {children}
    </div>
  );
}
