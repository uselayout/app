'use client';

import type { ReactNode } from 'react';

interface MockFrameProps {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}

export function MockFrame({ children, ariaLabel, className }: MockFrameProps) {
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className ?? ''}`}
      role="img"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}
