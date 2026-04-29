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
        // 1px outer bright ring + 1px inner subtle highlight + a wide soft shadow
        boxShadow: [
          '0 0 0 1px rgba(255,255,255,0.16)',
          'inset 0 1px 0 rgba(255,255,255,0.06)',
          '0 18px 48px -12px rgba(0,0,0,0.55)',
          '0 4px 12px -2px rgba(0,0,0,0.4)',
        ].join(', '),
      }}
    >
      {children}
    </div>
  );
}
