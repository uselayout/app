'use client';

import { useEffect, useState } from 'react';
import {
  motion,
  AnimatePresence,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Undo2,
  Redo2,
  Eye,
  MousePointer2,
  Smartphone,
  Tablet,
  Monitor,
  Magnet,
  Settings,
} from 'lucide-react';
import { STUDIO_TOKENS, MODE_TOKENS } from '@/components/marketing/mocks/_studio-chrome';

const T = STUDIO_TOKENS;
const LIGHT = MODE_TOKENS.light;
const LIME = '#E4F222';

// ── Types ────────────────────────────────────────────────────────────────────

type NodeId = 'button' | 'heading';
type TabId = 'layers' | 'edits' | 'requests';

interface NodeConfig {
  label: string;
  source: string;
  compliance: number;
  fill: { color: string; token: string } | null;
  typography: { fontSize: number; weight: string };
  showSpacing: boolean;
}

interface EditEntry {
  node: string;
  prop: string;
  from: string | null;
  to: string;
  time: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const NODE_DATA: Record<NodeId, NodeConfig> = {
  button: {
    label: 'button',
    source: 'App.tsx:48',
    compliance: 98,
    fill: { color: '#0a4b19', token: 'brand-primary' },
    typography: { fontSize: 16, weight: 'Medium' },
    showSpacing: true,
  },
  heading: {
    label: 'heading',
    source: 'InvoiceCard.tsx:12',
    compliance: 100,
    fill: null,
    typography: { fontSize: 28, weight: 'Bold' },
    showSpacing: false,
  },
};

const EDIT_HISTORY: EditEntry[] = [
  { node: 'button', prop: 'padding-x', from: 'px-4', to: 'px-6', time: 'just now' },
  { node: 'heading', prop: 'font-size', from: null, to: 'text-3xl', time: '5m ago' },
];

const REQUESTS: Array<{ label: string; status: string; color: string }> = [
  { label: 'Match CTA to pricing page', status: 'Pending', color: 'rgb(255,159,10)' },
  { label: 'Wire up export button', status: 'Agent working', color: 'rgb(10,132,255)' },
  { label: 'Swap hero illustration', status: 'Resolved by agent', color: 'rgb(52,199,89)' },
];

const TREE_ROWS: Array<{ label: string; depth: number; nodeId: NodeId | null }> = [
  { label: 'page', depth: 0, nodeId: null },
  { label: 'heading', depth: 1, nodeId: 'heading' },
  { label: 'button', depth: 2, nodeId: 'button' },
  { label: 'footer', depth: 1, nodeId: null },
];

// Auto-play: button (with full padding loop) → heading → edits tab → back
const SEQUENCE: Array<{ tab: TabId; node: NodeId; duration: number }> = [
  { tab: 'layers', node: 'button', duration: 5500 },
  { tab: 'layers', node: 'heading', duration: 2500 },
  { tab: 'edits', node: 'heading', duration: 3000 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function LogoMark({ size = 16, color = T.accent }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18.5586 18.5586" fill={color} aria-hidden>
      <path d="M13.7168 0C16.3906 0 18.5586 2.16798 18.5586 4.8418V18.5586H0V0H13.7168ZM1.61426 16.9443H5.64844V12.9102H1.61426V16.9443ZM7.26172 12.9102V16.9443H16.9453V12.9102H7.26172ZM1.61426 11.2969H5.64844V1.61426H1.61426V11.2969Z" />
    </svg>
  );
}

function TopButton({
  children,
  active,
  muted,
}: {
  children: React.ReactNode;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-md"
      style={{
        color: muted ? T.textMuted : active ? T.textPrimary : T.textSecondary,
        background: active ? T.accentSubtle : 'transparent',
        border: active ? `1px solid ${T.borderStrong}` : '1px solid transparent',
      }}
    >
      {children}
    </span>
  );
}

function Chip({ children, mono }: { children: React.ReactNode; mono?: boolean }) {
  return (
    <span
      className={`truncate rounded px-2 py-1 text-[11px] ${mono ? 'font-mono' : ''}`}
      style={{ background: T.bgSurface, color: T.textSecondary }}
    >
      {children}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function LayoutLiveMock() {
  const pad = useMotionValue(16);
  const padPx = useTransform(pad, (v) => `${Math.round(v)}px`);
  const [padNum, setPadNum] = useState(16);
  useMotionValueEvent(pad, 'change', (v) => setPadNum(Math.round(v)));

  const [selectedNode, setSelectedNode] = useState<NodeId>('button');
  const [activeTab, setActiveTab] = useState<TabId>('layers');

  // Padding animation — always running in the background
  useEffect(() => {
    const controls = animate(pad, [16, 24, 24, 16, 16], {
      duration: 4.4,
      repeat: Infinity,
      ease: 'easeInOut',
      times: [0, 0.35, 0.5, 0.85, 1],
    });
    return () => controls.stop();
  }, [pad]);

  // Auto-play sequence
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let stage = 0;

    function tick() {
      stage = (stage + 1) % SEQUENCE.length;
      const s = SEQUENCE[stage];
      setSelectedNode(s.node);
      setActiveTab(s.tab);
      timeout = setTimeout(tick, s.duration);
    }

    timeout = setTimeout(tick, SEQUENCE[0].duration);
    return () => clearTimeout(timeout);
  }, []);

  function handleSelect(nodeId: NodeId) {
    setSelectedNode(nodeId);
    setActiveTab('layers');
  }

  const node = NODE_DATA[selectedNode];

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{
        background: T.bgApp,
        colorScheme: 'dark',
        fontFamily: '"Geist", "Inter", -apple-system, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ height: 44, background: T.bgPanel, borderBottom: `1px solid ${T.border}` }}
      >
        <LogoMark />
        <span className="h-4 w-px" style={{ background: T.border }} />
        <div className="flex items-center gap-0.5">
          <TopButton muted><ChevronLeft size={14} /></TopButton>
          <TopButton muted><ChevronRight size={14} /></TopButton>
          <TopButton><RotateCw size={13} /></TopButton>
          <span className="mx-0.5 h-4 w-px" style={{ background: T.border }} />
          <TopButton active><Undo2 size={13} /></TopButton>
          <TopButton muted><Redo2 size={13} /></TopButton>
        </div>
        <Chip mono>~/invoices-app</Chip>
        <Chip mono>localhost:5173</Chip>
        <div className="ml-auto flex items-center gap-0.5">
          <TopButton muted><Eye size={14} /></TopButton>
          <TopButton active><MousePointer2 size={13} /></TopButton>
          <span className="mx-1 h-4 w-px" style={{ background: T.border }} />
          <TopButton><Smartphone size={14} /></TopButton>
          <TopButton><Tablet size={14} /></TopButton>
          <TopButton active><Monitor size={14} /></TopButton>
          <span className="mx-1 h-4 w-px" style={{ background: T.border }} />
          <TopButton active><Magnet size={14} /></TopButton>
          <TopButton><Settings size={14} /></TopButton>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <div
          className="flex w-[164px] shrink-0 flex-col"
          style={{ background: T.bgPanel, borderRight: `1px solid ${T.border}` }}
        >
          {/* Tabs */}
          <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
            {(['layers', 'edits', 'requests'] as const).map((tab) => (
              <div
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 py-1.5"
                style={{
                  borderBottom: activeTab === tab ? `1px solid ${T.accent}` : '1px solid transparent',
                  marginBottom: -1,
                }}
              >
                <span
                  className="text-[10px] capitalize"
                  style={{ color: activeTab === tab ? T.textPrimary : T.textMuted }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </span>
                {tab === 'edits' && (
                  <span
                    className="rounded-full px-1 font-mono text-[9px]"
                    style={{ background: T.accentSubtle, color: T.textSecondary }}
                  >
                    {EDIT_HISTORY.length}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === 'layers' && (
              <motion.div
                key="layers"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col py-1"
              >
                {TREE_ROWS.map((row) => (
                  <div
                    key={row.label}
                    onClick={() => row.nodeId && handleSelect(row.nodeId)}
                    className={`flex items-center py-[3px] ${row.nodeId ? 'cursor-pointer' : ''}`}
                    style={{
                      paddingLeft: 8 + row.depth * 12,
                      paddingRight: 8,
                      background:
                        row.nodeId && selectedNode === row.nodeId
                          ? 'rgba(228,242,34,0.08)'
                          : 'transparent',
                      borderLeft:
                        row.nodeId && selectedNode === row.nodeId
                          ? `2px solid ${LIME}`
                          : '2px solid transparent',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <span
                      className="text-[11px]"
                      style={{
                        color:
                          row.nodeId && selectedNode === row.nodeId
                            ? T.textPrimary
                            : T.textSecondary,
                      }}
                    >
                      {row.label}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'edits' && (
              <motion.div
                key="edits"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col gap-1.5 px-2 py-2"
              >
                {EDIT_HISTORY.map((edit, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 rounded-md p-2"
                    style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px]" style={{ color: T.textPrimary }}>
                        {edit.node}
                      </span>
                      <span className="text-[9px]" style={{ color: T.textMuted }}>
                        {edit.time}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-[10px]">
                      <span style={{ color: T.textMuted }}>{edit.prop}</span>
                      {edit.from && (
                        <>
                          <span style={{ color: 'rgb(255,69,58)' }}>{edit.from}</span>
                          <span style={{ color: T.textMuted }}>→</span>
                        </>
                      )}
                      <span style={{ color: 'rgb(52,199,89)' }}>{edit.to}</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex flex-col gap-1.5 px-2 py-2"
              >
                {REQUESTS.map((req, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-0.5 rounded-md p-2"
                    style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
                  >
                    <div className="flex items-start gap-1.5">
                      <span
                        className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: req.color }}
                      />
                      <span className="text-[10px] leading-[14px]" style={{ color: T.textPrimary }}>
                        {req.label}
                      </span>
                    </div>
                    <span className="pl-3 text-[9px]" style={{ color: req.color }}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Canvas */}
        <div
          className="relative flex flex-1 items-center justify-center p-8"
          style={{ background: LIGHT.surface }}
        >
          <div
            className="w-full max-w-[360px] rounded-xl p-6"
            style={{ border: `1px solid ${LIGHT.border}`, background: '#FCFCFB' }}
          >
            {/* Heading — selectable */}
            <div className="relative mb-4">
              <div
                className="cursor-pointer rounded"
                onClick={() => handleSelect('heading')}
                style={{
                  padding: '3px 5px',
                  margin: '-3px -5px',
                  boxShadow:
                    selectedNode === 'heading'
                      ? `0 0 0 2px ${LIME}, 0 0 0 4px rgba(228,242,34,0.25)`
                      : 'none',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                <div className="mb-1 text-[13px]" style={{ color: LIGHT.textMuted }}>
                  Outstanding
                </div>
                <div
                  className="text-[28px] font-bold tracking-tight"
                  style={{ color: LIGHT.textPrimary }}
                >
                  £12,480
                </div>
              </div>
              {selectedNode === 'heading' && (
                <span
                  className="pointer-events-none absolute -top-5 left-0 rounded px-1 py-0.5 text-[9px] font-medium"
                  style={{ background: LIME, color: '#15200a' }}
                >
                  heading
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {selectedNode === 'button' && (
                  <span
                    className="pointer-events-none absolute -left-1.5 -top-5 rounded px-1 py-0.5 text-[9px] font-medium"
                    style={{ background: LIME, color: '#15200a' }}
                  >
                    button
                  </span>
                )}
                <motion.button
                  className="cursor-pointer rounded-lg text-[13px] font-medium"
                  onClick={() => handleSelect('button')}
                  style={{
                    paddingLeft: padPx,
                    paddingRight: padPx,
                    paddingTop: 8,
                    paddingBottom: 8,
                    background: '#0a4b19',
                    color: '#fff',
                    boxShadow:
                      selectedNode === 'button'
                        ? `0 0 0 2px ${LIME}, 0 0 0 4px rgba(228,242,34,0.25)`
                        : 'none',
                    transition: 'box-shadow 0.15s ease',
                  }}
                >
                  New invoice
                </motion.button>
              </div>
              <span className="text-[13px]" style={{ color: LIGHT.textSecondary }}>
                Add contact
              </span>
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div
          className="flex w-[272px] shrink-0 flex-col overflow-y-auto p-3"
          style={{ background: T.bgPanel, borderLeft: `1px solid ${T.border}` }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="flex flex-col gap-2"
            >
              {/* Element header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium" style={{ color: T.textPrimary }}>
                  {node.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: T.textMuted }}>
                  {node.source}
                </span>
              </div>

              {/* Breakpoint badge */}
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: T.textMuted }}>
                  Editing: Desktop
                </span>
                <div className="flex items-center gap-1">
                  {(['D', 'T', 'M'] as const).map((bp) => (
                    <span
                      key={bp}
                      className="flex h-4 w-4 items-center justify-center rounded font-mono text-[9px]"
                      style={{
                        background: bp === 'D' ? T.accent : 'transparent',
                        color: bp === 'D' ? T.textOnAccent : T.textMuted,
                        border: `1px solid ${bp === 'D' ? T.accent : T.border}`,
                      }}
                    >
                      {bp}
                    </span>
                  ))}
                </div>
              </div>

              {/* Spacing (button only) */}
              {node.showSpacing && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
                >
                  <div
                    className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: T.textMuted }}
                  >
                    Spacing
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: T.textSecondary }}>
                      Padding · X
                    </span>
                    <div
                      className="flex items-center gap-2 rounded-md px-2 py-1"
                      style={{ background: T.bgElevated, border: `1px solid ${T.borderFocus}` }}
                    >
                      <motion.span
                        className="font-mono text-[12px] tabular-nums"
                        style={{ color: T.textPrimary }}
                      >
                        {padNum}
                      </motion.span>
                      <span className="font-mono text-[11px]" style={{ color: T.textMuted }}>
                        px
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[4, 8, 12, 16, 20, 24].map((v) => (
                      <span
                        key={v}
                        className="flex-1 rounded text-center text-[9px] font-mono"
                        style={{
                          padding: '2px 0',
                          background: padNum === v ? T.accent : 'transparent',
                          color: padNum === v ? T.textOnAccent : T.textMuted,
                          border: `1px solid ${padNum === v ? T.accent : T.border}`,
                          transition: 'background 0.1s, color 0.1s',
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Typography */}
              <div
                className="rounded-lg p-3"
                style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
              >
                <div
                  className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: T.textMuted }}
                >
                  Typography
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: T.textSecondary }}>
                      Font size
                    </span>
                    <div
                      className="flex items-center gap-2 rounded-md px-2 py-1"
                      style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}
                    >
                      <span
                        className="font-mono text-[12px] tabular-nums"
                        style={{ color: T.textPrimary }}
                      >
                        {node.typography.fontSize}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: T.textMuted }}>
                        px
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: T.textSecondary }}>
                      Weight
                    </span>
                    <div
                      className="flex items-center gap-1.5 rounded-md px-2 py-1"
                      style={{ background: T.bgElevated, border: `1px solid ${T.border}` }}
                    >
                      <span className="text-[11px]" style={{ color: T.textPrimary }}>
                        {node.typography.weight}
                      </span>
                      <span className="text-[9px]" style={{ color: T.textMuted }}>
                        ▾
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fill (if applicable) */}
              {node.fill && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
                >
                  <div
                    className="mb-2 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: T.textMuted }}
                  >
                    Fill
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 rounded"
                      style={{ background: node.fill.color, border: `1px solid ${T.border}` }}
                    />
                    <span className="font-mono text-[11px]" style={{ color: T.textSecondary }}>
                      {node.fill.token}
                    </span>
                    <span
                      className="ml-auto h-1.5 w-1.5 rounded-full"
                      style={{ background: 'rgb(52,199,89)' }}
                      title="on-system"
                    />
                  </div>
                </div>
              )}

              {/* Compliance */}
              <div
                className="rounded-lg p-3"
                style={{ background: T.bgSurface, border: `1px solid ${T.border}` }}
              >
                <div className="mb-1.5 flex items-center justify-between text-[11px]">
                  <span style={{ color: T.textSecondary }}>Compliance</span>
                  <motion.span
                    key={node.compliance}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="font-mono"
                    style={{ color: 'rgb(52,199,89)' }}
                  >
                    {node.compliance}
                  </motion.span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: T.bgElevated }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${node.compliance}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ background: 'rgb(52,199,89)' }}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
