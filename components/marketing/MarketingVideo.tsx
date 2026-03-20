'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';

interface MarketingVideoProps {
  src: string;
  ariaLabel?: string;
  className?: string;
}

export function MarketingVideo({ src, ariaLabel, className }: MarketingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (entry.isIntersecting) {
          // Lazy-load: only set src when scrolled into view
          if (!activeSrc) setActiveSrc(src);
          if (video) video.play().catch(() => {});
        } else {
          if (video) video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [src, activeSrc]);

  const handleRestart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full ${className ?? ''}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={activeSrc}
        muted
        loop
        playsInline
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        aria-label={ariaLabel}
      />
      <button
        onClick={handleRestart}
        className={`absolute bottom-3 right-3 z-10 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all duration-150 cursor-pointer ${
          hovering ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Restart video"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
