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

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

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
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        aria-label={ariaLabel}
      />
      <button
        onClick={handleRestart}
        className={`absolute bottom-3 right-3 p-1.5 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all duration-150 cursor-pointer ${
          hovering ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="Restart video"
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
}
