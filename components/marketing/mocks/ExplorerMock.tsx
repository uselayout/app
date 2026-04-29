'use client';

import { motion } from 'framer-motion';

interface VariantTileProps {
  index: number;
  delay: number;
  health: number;
  active: boolean;
  variant: 'login' | 'login-social' | 'login-split' | 'login-card' | 'login-minimal' | 'login-image';
}

function MiniLogin({ variant }: { variant: VariantTileProps['variant'] }) {
  if (variant === 'login') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-3 gap-1.5">
        <h5 className="text-[11px] font-semibold text-white">Sign in</h5>
        <div className="w-full max-w-[140px] flex flex-col gap-1.5 mt-1">
          <div className="h-4 rounded bg-white/8 border border-white/10" />
          <div className="h-4 rounded bg-white/8 border border-white/10" />
          <div className="h-4 rounded bg-[#E4F222] mt-0.5" />
        </div>
      </div>
    );
  }
  if (variant === 'login-social') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-3 gap-1.5">
        <h5 className="text-[11px] font-semibold text-white">Welcome back</h5>
        <div className="w-full max-w-[150px] flex flex-col gap-1.5 mt-1">
          <div className="h-4 rounded border border-white/15 bg-white/5 flex items-center justify-center text-[7px] font-mono text-white/65">G  GitHub</div>
          <div className="h-4 rounded border border-white/15 bg-white/5 flex items-center justify-center text-[7px] font-mono text-white/65">G  Google</div>
          <div className="text-center text-[7px] font-mono text-white/35 my-0.5">or email</div>
          <div className="h-3 rounded bg-white/8 border border-white/10" />
        </div>
      </div>
    );
  }
  if (variant === 'login-split') {
    return (
      <div className="grid grid-cols-2 w-full h-full">
        <div
          className="h-full"
          style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3a3f0a 100%)' }}
        />
        <div className="flex flex-col justify-center gap-1.5 p-3">
          <h5 className="text-[10px] font-semibold text-white leading-tight">Layout</h5>
          <div className="h-3 rounded bg-white/8 border border-white/10" />
          <div className="h-3 rounded bg-white/8 border border-white/10" />
          <div className="h-3 rounded bg-white text-[7px] font-medium text-black flex items-center justify-center">→</div>
        </div>
      </div>
    );
  }
  if (variant === 'login-card') {
    return (
      <div className="flex items-center justify-center w-full h-full p-3">
        <div className="w-full max-w-[150px] rounded-md border border-white/12 bg-[#161620] p-2.5 flex flex-col gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          <span className="text-[7px] font-mono text-white/45">SECURE</span>
          <h5 className="text-[10px] font-semibold text-white">Continue</h5>
          <div className="h-3 rounded bg-white/8 border border-white/10" />
          <div className="h-3 rounded bg-[#E4F222]" />
        </div>
      </div>
    );
  }
  if (variant === 'login-minimal') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-3 gap-2">
        <div className="h-3 w-3 rounded-full bg-[#E4F222]" />
        <h5 className="text-[10px] font-semibold text-white text-center leading-tight">
          One-click<br />sign-in
        </h5>
        <div className="h-3 w-full max-w-[120px] rounded-full bg-white border border-white/15 flex items-center justify-center text-[7px] font-medium text-black">
          email
        </div>
      </div>
    );
  }
  // login-image
  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle at 30% 30%, #E4F222 0%, #14140a 60%, #0C0C0E 100%)' }}
      />
      <div className="relative flex flex-col items-start justify-end gap-1.5 w-full h-full p-3">
        <span className="rounded border border-white/20 bg-black/30 px-1.5 py-0.5 text-[7px] font-mono text-white/70 backdrop-blur">
          NEW
        </span>
        <h5 className="text-[10px] font-semibold text-white leading-tight">
          Get started in 30s.
        </h5>
        <div className="h-3 w-[80px] rounded bg-white text-[7px] font-medium text-black flex items-center justify-center">
          Sign in
        </div>
      </div>
    </div>
  );
}

function VariantTile({ index, delay, health, active, variant }: VariantTileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0, 0, 0.2, 1] }}
      viewport={{ once: true, margin: '-10%' }}
      className="relative flex flex-col rounded-lg border bg-[#141418] overflow-hidden"
      style={{
        borderColor: active ? 'rgba(228,242,34,0.45)' : 'rgba(255,255,255,0.10)',
        boxShadow: active
          ? '0 0 0 1px rgba(228,242,34,0.2), 0 4px 14px rgba(0,0,0,0.5)'
          : '0 1px 4px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-2.5 py-1">
        <span className="font-mono text-[8px] text-white/50">v{index + 1}</span>
        <div className="flex items-center gap-1 font-mono text-[8px]">
          <span className={
            health >= 90
              ? 'text-emerald-300'
              : health >= 80
              ? 'text-white/65'
              : 'text-amber-300'
          }>
            {health}
          </span>
          <span className="text-white/25">·</span>
          <span className="text-white/40">★</span>
        </div>
      </div>
      <div className="flex-1 bg-[#0E0E12] min-h-0 flex">
        <MiniLogin variant={variant} />
      </div>
      <div className="flex items-center justify-between border-t border-white/8 px-2.5 py-1">
        <div className="flex items-center gap-1.5 text-white/50">
          <button>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
            </svg>
          </button>
        </div>
        <span className="font-mono text-[8px] text-white/35">on-system</span>
      </div>
    </motion.div>
  );
}

const VARIANTS: VariantTileProps['variant'][] = [
  'login',
  'login-social',
  'login-split',
  'login-card',
  'login-minimal',
  'login-image',
];

const HEALTH = [92, 88, 95, 84, 90, 87];

export function ExplorerMock() {
  return (
    <div
      className="absolute inset-0 flex flex-col text-white"
      style={{
        backgroundColor: '#0C0C0E',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
        colorScheme: 'dark',
      }}
    >
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          </div>
          <span className="font-mono text-[11px] text-white/50">
            layout.design / acme · explorer · login form
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white/70">
            ↻ Regenerate all
          </button>
          <button className="rounded-md border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white/70">
            ⇆ Compare
          </button>
        </div>
      </div>

      {/* Prompt + reference */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-2.5 shrink-0">
        <span className="font-mono text-[10px] text-white/40 shrink-0">prompt</span>
        <div className="flex-1 rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-[12px] font-mono text-white/75">
          A modern login form with social auth, on-brand
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.025] px-2 py-1">
          <div
            className="h-5 w-5 rounded shrink-0"
            style={{ background: 'linear-gradient(135deg, #E4F222 0%, #3a3f0a 100%)' }}
          />
          <span className="font-mono text-[10px] text-white/55">reference.png</span>
        </div>
        <button className="rounded-md bg-[#E4F222] px-3 py-1.5 text-[11px] font-medium text-black">
          Generate 6
        </button>
      </div>

      {/* Variant grid 3x2 */}
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4 px-6 py-6 overflow-hidden min-h-0">
        {VARIANTS.map((v, i) => (
          <VariantTile
            key={i}
            index={i}
            delay={0.15 + i * 0.06}
            health={HEALTH[i]}
            active={i === 2}
            variant={v}
          />
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2 shrink-0 text-[10px] font-mono">
        <div className="flex items-center gap-3 text-white/45">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
            6 variants ready
          </span>
          <span className="text-white/20">·</span>
          <span>avg health 89/100</span>
          <span className="text-white/20">·</span>
          <span>1.4s</span>
        </div>
        <div className="flex items-center gap-2 text-white/55">
          <span className="text-white/35">v3 selected</span>
          <button className="rounded border border-white/15 px-2 py-0.5 hover:bg-white/5">Push to Figma</button>
          <button className="rounded border border-white/15 px-2 py-0.5 hover:bg-white/5">Save</button>
          <button className="rounded bg-white px-2 py-0.5 text-black">Export code</button>
        </div>
      </div>
    </div>
  );
}
