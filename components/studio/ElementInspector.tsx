"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Paintbrush, Type, Maximize2, Move, MessageSquarePlus, Send, ImageIcon, Loader2 } from "lucide-react";
import { getStoredGoogleApiKey } from "@/lib/hooks/use-api-key";
import { isPlaceholderSrc } from "@/lib/image/placeholder";
import { toast } from "sonner";
import type { StyleEdit, ElementAnnotation, ExtractedToken } from "@/lib/types";

interface ComputedStyles {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  display?: string;
  flexDirection?: string;
  gap?: string;
  alignItems?: string;
  justifyContent?: string;
  width?: string;
  height?: string;
  maxWidth?: string;
  textAlign?: string;
  opacity?: string;
  textContent?: string;
}

interface SelectedElement {
  elementId: string;
  elementTag: string;
  elementClasses: string;
  rect: { x: number; y: number; width: number; height: number };
  computedStyles: ComputedStyles;
  imagePrompt?: string;
  imageStyle?: string;
  imageRatio?: string;
  imageSrc?: string;
}

interface ElementInspectorProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isActive: boolean;
  onStyleEdits: (edits: StyleEdit[]) => void;
  onAnnotationsSubmit?: (annotations: ElementAnnotation[]) => void;
  onImageGenerated?: (prompt: string, imageUrl: string, context?: { alt?: string; currentSrc?: string; className?: string }) => void;
  onDeselect: () => void;
  onReset?: () => void;
  designTokens?: ExtractedToken[];
  /** Scale factor applied to the iframe (e.g. 0.5 for 50% scale) */
  iframeScale?: number;
}

type PropertySection = "text" | "colours" | "spacing" | "size" | "annotate" | "image";

interface TokenSuggestion {
  name: string;
  value: string;
  cssVariable: string;
}

interface PropertyRowProps {
  label: string;
  value: string;
  cssProp: string;
  onApply: (prop: string, value: string) => void;
  type?: "text" | "color" | "select";
  options?: string[];
  tokenSuggestions?: TokenSuggestion[];
}

function PropertyRow({ label, value, cssProp, onApply, type = "text", options, tokenSuggestions }: PropertyRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
    setEditing(false);
  }, [value]);

  const commit = useCallback(() => {
    if (editValue !== value) {
      onApply(cssProp, editValue);
    }
    setEditing(false);
  }, [editValue, value, cssProp, onApply]);

  const [showTokens, setShowTokens] = useState(false);
  const matchingTokens = tokenSuggestions?.filter((t) => {
    if (type === "color") {
      // Match tokens that are similar colours
      return t.value.startsWith("#") || t.value.startsWith("rgb");
    }
    return true;
  }).slice(0, 5) ?? [];

  if (type === "color") {
    return (
      <div className="relative py-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20 min-w-0 truncate">{label}</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={rgbToHex(editValue)}
              onChange={(e) => {
                setEditValue(e.target.value);
                onApply(cssProp, e.target.value);
              }}
              className="h-5 w-5 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0"
            />
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
              className="w-[90px] rounded bg-[var(--bg-surface)] border border-[var(--studio-border)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)]"
            />
            {matchingTokens.length > 0 && (
              <button
                onClick={() => setShowTokens(!showTokens)}
                className="shrink-0 rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                title="Design system colours"
              >
                <Paintbrush size={10} />
              </button>
            )}
          </div>
        </div>
        {showTokens && matchingTokens.length > 0 && (
          <TokenDropdown tokens={matchingTokens} onSelect={(t) => { setEditValue(t.cssVariable); onApply(cssProp, t.value); setShowTokens(false); }} onClose={() => setShowTokens(false)} />
        )}
      </div>
    );
  }

  if (type === "select" && options) {
    return (
      <div className="flex items-center justify-between gap-2 py-1">
        <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20 min-w-0 truncate">{label}</span>
        <select
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            onApply(cssProp, e.target.value);
          }}
          className="min-w-0 flex-1 max-w-[120px] rounded bg-[var(--bg-surface)] border border-[var(--studio-border)] px-1 py-0.5 text-[10px] text-[var(--text-primary)] outline-none"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20 min-w-0 truncate">{label}</span>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setEditValue(value); setEditing(false); }
          }}
          autoFocus
          className="w-[100px] rounded bg-[var(--bg-surface)] border border-[var(--studio-border-focus)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="w-[100px] text-right rounded px-1.5 py-0.5 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors truncate"
        >
          {value || "—"}
        </button>
      )}
    </div>
  );
}

function TokenDropdown({ tokens, onSelect, onClose }: {
  tokens: TokenSuggestion[];
  onSelect: (token: TokenSuggestion) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-full z-10 mt-0.5 w-[180px] rounded-md border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] py-0.5 shadow-lg">
      <div className="px-2 py-1 text-[8px] uppercase tracking-wider text-[var(--text-muted)]">Design tokens</div>
      {tokens.map((t) => (
        <button
          key={t.name}
          onClick={() => onSelect(t)}
          className="flex w-full items-center gap-2 px-2 py-1 text-left hover:bg-[var(--bg-hover)] transition-colors"
        >
          {(t.value.startsWith("#") || t.value.startsWith("rgb")) && (
            <span className="h-3 w-3 shrink-0 rounded-sm border border-[var(--studio-border)]" style={{ backgroundColor: t.value }} />
          )}
          <span className="text-[9px] text-[var(--text-primary)] truncate">{t.cssVariable}</span>
          <span className="text-[8px] text-[var(--text-muted)] ml-auto shrink-0">{t.value}</span>
        </button>
      ))}
      <button onClick={onClose} className="w-full px-2 py-0.5 text-[8px] text-[var(--text-muted)] hover:text-[var(--text-primary)] text-center">
        Dismiss
      </button>
    </div>
  );
}

function GapSelect({ value, spacingTokens, onApply }: {
  value: string;
  spacingTokens: TokenSuggestion[];
  onApply: (prop: string, value: string) => void;
}) {
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState(value);

  const options = [
    { label: "normal", value: "normal" },
    { label: "0", value: "0" },
    ...spacingTokens.map((t) => ({ label: `${t.name} (${t.value})`, value: t.value })),
  ];

  // Check if current value matches any option
  const isKnownValue = options.some((o) => o.value === value);

  if (customMode) {
    return (
      <div className="flex items-center justify-between gap-2 py-1">
        <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20">Gap</span>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onBlur={() => { if (customValue !== value) onApply("gap", customValue); setCustomMode(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onApply("gap", customValue); setCustomMode(false); }
              if (e.key === "Escape") setCustomMode(false);
            }}
            autoFocus
            className="w-[80px] rounded bg-[var(--bg-surface)] border border-[var(--studio-border-focus)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] outline-none"
          />
          <button onClick={() => setCustomMode(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={10} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-20">Gap</span>
      <select
        value={isKnownValue ? value : "__current__"}
        onChange={(e) => {
          if (e.target.value === "__custom__") { setCustomValue(value); setCustomMode(true); return; }
          if (e.target.value === "__current__") return;
          onApply("gap", e.target.value);
        }}
        className="w-[100px] rounded bg-[var(--bg-surface)] border border-[var(--studio-border)] px-1 py-0.5 text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)]"
      >
        {!isKnownValue && <option value="__current__">{value || "—"}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
        <option value="__custom__">Custom...</option>
      </select>
    </div>
  );
}

function rgbToHex(rgb: string): string {
  if (rgb.startsWith("#")) return rgb.length === 4 || rgb.length === 7 ? rgb : "#000000";
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#000000";
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(+match[1])}${hex(+match[2])}${hex(+match[3])}`;
}

export function ElementInspector({
  iframeRef,
  containerRef,
  isActive,
  onStyleEdits,
  onAnnotationsSubmit,
  onImageGenerated,
  onDeselect,
  onReset,
  designTokens,
  iframeScale = 0.5,
}: ElementInspectorProps) {
  const [selected, setSelected] = useState<SelectedElement | null>(null);
  const [activeSection, setActiveSection] = useState<PropertySection>("text");
  const [pendingEdits, setPendingEdits] = useState<StyleEdit[]>([]);
  const [annotations, setAnnotations] = useState<ElementAnnotation[]>([]);
  const [annotationText, setAnnotationText] = useState("");
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; panelX: number; panelY: number } | null>(null);
  const [panelSize, setPanelSize] = useState<{ width: number; height: number }>({ width: 300, height: 480 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
  const [imagePromptEdit, setImagePromptEdit] = useState("");
  const [imageStyleEdit, setImageStyleEdit] = useState("photo");
  const [imageRatioEdit, setImageRatioEdit] = useState("16:9");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<SelectedElement | null>(null);
  const pendingEditsRef = useRef<StyleEdit[]>([]);

  const activeSectionRef = useRef(activeSection);

  // Keep refs in sync so message listener can read without re-triggering effect
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { pendingEditsRef.current = pendingEdits; }, [pendingEdits]);
  useEffect(() => { activeSectionRef.current = activeSection; }, [activeSection]);

  // Sync image edit state when an image element is selected
  const validStyles = ["photo", "illustration", "icon", "abstract"];
  const validRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "21:9"];
  useEffect(() => {
    if (selected?.imagePrompt) {
      setImagePromptEdit(selected.imagePrompt);
      const style = selected.imageStyle?.toLowerCase() ?? "";
      setImageStyleEdit(validStyles.includes(style) ? style : "photo");
      setImageRatioEdit(validRatios.includes(selected.imageRatio ?? "") ? selected.imageRatio! : "1:1");
    }
  }, [selected?.elementId, selected?.imagePrompt, selected?.imageStyle, selected?.imageRatio]);

  // Build token suggestions from design tokens
  const tokenSuggestions: TokenSuggestion[] = (designTokens ?? []).map((t) => ({
    name: t.name,
    value: t.value,
    cssVariable: t.cssVariable ?? `var(--${t.name})`,
  }));

  const colorTokens = tokenSuggestions.filter((t) => t.value.startsWith("#") || t.value.startsWith("rgb"));
  const spacingTokens = tokenSuggestions.filter((t) => t.value.match(/^\d+px$|^\d+rem$/));
  const fontTokens = tokenSuggestions.filter((t) => t.name.toLowerCase().includes("font") || t.name.toLowerCase().includes("type"));

  // Build font family options from design tokens + common web fonts
  const fontFamilyOptions: string[] = [
    ...fontTokens.map((t) => t.value),
    ...(designTokens ?? [])
      .filter((t) => t.name.toLowerCase().includes("font") && !t.value.match(/^\d/))
      .map((t) => t.value),
  ];
  // Deduplicate and add common fallbacks
  const fontFamilySet = new Set(fontFamilyOptions);
  for (const f of ["system-ui, sans-serif", "Georgia, serif", "'Courier New', monospace", "inherit"]) {
    fontFamilySet.add(f);
  }

  // Listen for messages from the iframe
  useEffect(() => {
    if (!isActive) {
      setSelected(null);
      setPendingEdits([]);
      return;
    }

    function handleMessage(e: MessageEvent) {
      const msg = e.data;
      if (!msg?.type) return;

      if (msg.type === "layout-inspector-select") {
        const isSameElement = selectedRef.current?.elementId === msg.elementId;

        // Auto-apply pending edits when switching to a different element
        if (!isSameElement && pendingEditsRef.current.length > 0) {
          onStyleEdits(pendingEditsRef.current);
          setPendingEdits([]);
        }

        const newSelected: SelectedElement = {
          elementId: msg.elementId,
          elementTag: msg.elementTag,
          elementClasses: msg.elementClasses,
          rect: msg.rect,
          computedStyles: msg.computedStyles,
          imagePrompt: msg.imagePrompt,
          imageStyle: msg.imageStyle,
          imageRatio: msg.imageRatio,
          imageSrc: msg.imageSrc,
        };
        setSelected(newSelected);

        // Auto-select Image tab when clicking an image element,
        // reset to Text tab when clicking a non-image element
        if (msg.imagePrompt) {
          setActiveSection("image");
        } else if (activeSectionRef.current === "image") {
          setActiveSection("text");
        }

        // Only clear pending edits when switching to a different element
        if (!isSameElement) {
          setPendingEdits([]);
        }
      }

      if (msg.type === "layout-inspector-style-updated" && selectedRef.current) {
        setSelected((prev) =>
          prev ? { ...prev, computedStyles: msg.computedStyles, rect: msg.rect } : null
        );
      }

      if (msg.type === "layout-inspector-text-changed") {
        const edit: StyleEdit = {
          elementId: msg.elementId,
          elementTag: msg.elementTag,
          elementClasses: msg.elementClasses,
          property: "textContent",
          before: selectedRef.current?.computedStyles.textContent ?? "",
          after: msg.textContent,
        };
        setPendingEdits((prev) => {
          const existing = prev.findIndex((e) => e.property === "textContent" && e.elementId === msg.elementId);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = edit;
            return updated;
          }
          return [...prev, edit];
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isActive]);

  const applyStyle = useCallback(
    (property: string, value: string) => {
      const sel = selectedRef.current;
      if (!sel || !iframeRef.current?.contentWindow) return;

      const before = sel.computedStyles[property as keyof ComputedStyles] ?? "";
      iframeRef.current.contentWindow.postMessage(
        { type: "layout-inspector-apply-style", property, value },
        "*"
      );

      setPendingEdits((prev) => {
        const existing = prev.findIndex((e) => e.property === property && e.elementId === sel.elementId);
        const edit: StyleEdit = {
          elementId: sel.elementId,
          elementTag: sel.elementTag,
          elementClasses: sel.elementClasses,
          property,
          before,
          after: value,
        };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = edit;
          return updated;
        }
        return [...prev, edit];
      });
    },
    [iframeRef]
  );

  const handleApplyAll = useCallback(() => {
    if (pendingEdits.length > 0) {
      onStyleEdits(pendingEdits);
      setPendingEdits([]);
    }
  }, [pendingEdits, onStyleEdits]);

  const handleGenerateImage = useCallback(async () => {
    if (!selected || !imagePromptEdit.trim()) return;

    const googleKey = getStoredGoogleApiKey();
    if (!googleKey) {
      toast.error("Add a Google AI API key in Settings → API Keys to generate images.");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (googleKey) headers["X-Google-Api-Key"] = googleKey;

      const res = await fetch("/api/generate/image", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          mode: "single",
          prompt: imagePromptEdit.trim(),
          style: imageStyleEdit,
          aspectRatio: imageRatioEdit,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Image generation failed" }));
        toast.error(err.error ?? "Image generation failed");
        return;
      }

      const data = await res.json();
      if (data.url) {
        // Update the image src in the iframe
        iframeRef.current?.contentWindow?.postMessage({
          type: "layout-inspector-apply-style",
          elementId: selected.elementId,
          property: "src",
          value: data.url,
        }, "*");

        // Update selected state
        setSelected((prev) => prev ? { ...prev, imageSrc: data.url } : null);

        // Persist to variant source code so it survives exiting Inspector
        onImageGenerated?.(imagePromptEdit.trim(), data.url, {
          currentSrc: selected.imageSrc,
          className: selected.elementClasses,
        });
      }
    } catch (err) {
      console.error("Image generation error:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  }, [selected, imagePromptEdit, imageStyleEdit, imageRatioEdit, iframeRef, onImageGenerated]);

  // --- Drag handling ---
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = popoverRef.current?.getBoundingClientRect();
    const container = containerRef.current?.getBoundingClientRect();
    if (!rect || !container) return;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      panelX: rect.left - container.left,
      panelY: rect.top - container.top,
    };
    setIsDragging(true);
  }, [containerRef]);

  useEffect(() => {
    if (!isDragging) return;
    function onMouseMove(e: MouseEvent) {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setDragPos({
        x: dragStartRef.current.panelX + dx,
        y: dragStartRef.current.panelY + dy,
      });
    }
    function onMouseUp() {
      setIsDragging(false);
      dragStartRef.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  // Reset drag position when selecting a new element
  useEffect(() => {
    setDragPos(null);
  }, [selected?.elementId]);

  // --- Resize handling ---
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: panelSize.width,
      height: panelSize.height,
    };
    setIsResizing(true);
  }, [panelSize]);

  useEffect(() => {
    if (!isResizing) return;
    function onMouseMove(e: MouseEvent) {
      if (!resizeStartRef.current) return;
      const dx = e.clientX - resizeStartRef.current.mouseX;
      const dy = e.clientY - resizeStartRef.current.mouseY;
      setPanelSize({
        width: Math.max(280, Math.min(500, resizeStartRef.current.width + dx)),
        height: Math.max(200, Math.min(700, resizeStartRef.current.height + dy)),
      });
    }
    function onMouseUp() {
      setIsResizing(false);
      resizeStartRef.current = null;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  const handleClose = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: "layout-inspector-deselect" }, "*");
    }
    setSelected(null);
    setPendingEdits([]);
    onDeselect();
  }, [iframeRef, onDeselect]);

  const handleAddAnnotation = useCallback(() => {
    const sel = selectedRef.current;
    if (!sel || !annotationText.trim()) return;
    const ann: ElementAnnotation = {
      elementId: sel.elementId,
      elementTag: sel.elementTag,
      note: annotationText.trim(),
      rect: sel.rect,
    };
    setAnnotations((prev) => [...prev, ann]);
    setAnnotationText("");
  }, [annotationText]);

  const handleSubmitAnnotations = useCallback(() => {
    if (annotations.length > 0 && onAnnotationsSubmit) {
      onAnnotationsSubmit(annotations);
      setAnnotations([]);
    }
  }, [annotations, onAnnotationsSubmit]);

  if (!isActive || !selected) return null;

  // Calculate popover position relative to the container
  const containerRect = containerRef.current?.getBoundingClientRect();
  const popoverX = (selected.rect.x + selected.rect.width) * iframeScale + 8;
  const popoverY = selected.rect.y * iframeScale;

  // Use drag position if user has dragged, otherwise auto-position near element
  const autoX = Math.min(popoverX, containerRect ? containerRect.width - panelSize.width - 10 : popoverX);
  const autoY = Math.max(0, Math.min(popoverY, containerRect ? containerRect.height - panelSize.height - 10 : popoverY));
  const finalX = dragPos?.x ?? autoX;
  const finalY = dragPos?.y ?? autoY;

  const cs = selected.computedStyles;

  const hasImageData = !!selected.imagePrompt;
  const sections: { id: PropertySection; icon: React.ReactNode; label: string }[] = [
    ...(hasImageData ? [{ id: "image" as const, icon: <ImageIcon size={11} />, label: "Image" }] : []),
    { id: "text", icon: <Type size={11} />, label: "Text" },
    { id: "colours", icon: <Paintbrush size={11} />, label: "Colours" },
    { id: "spacing", icon: <Move size={11} />, label: "Spacing" },
    { id: "size", icon: <Maximize2 size={11} />, label: "Size" },
    ...(onAnnotationsSubmit ? [{ id: "annotate" as const, icon: <MessageSquarePlus size={11} />, label: "Note" }] : []),
  ];

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 rounded-lg border border-[var(--studio-border-strong)] bg-[var(--bg-elevated)] shadow-lg flex flex-col"
      style={{ left: finalX, top: finalY, width: panelSize.width, height: panelSize.height }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header — drag handle */}
      <div
        onMouseDown={handleDragStart}
        className={`flex items-center justify-between border-b border-[var(--studio-border)] px-2.5 py-1.5 select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <span className="text-[10px] font-medium text-[var(--text-secondary)]">
          &lt;{selected.elementTag}&gt;
        </span>
        <button
          onClick={handleClose}
          className="rounded p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-[var(--studio-border)]">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] transition-colors ${
              activeSection === s.id
                ? "text-[var(--text-primary)] border-b border-[var(--studio-accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {s.icon}
          </button>
        ))}
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-1.5">
        {activeSection === "image" && hasImageData && (
          <div className="flex flex-col gap-2 h-full">
            <label className="text-[10px] text-[var(--text-muted)]">Prompt</label>
            <textarea
              value={imagePromptEdit}
              onChange={(e) => setImagePromptEdit(e.target.value)}
              rows={5}
              className="w-full rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--studio-border-focus)] focus:outline-none resize-none"
              placeholder="Describe the image..."
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-muted)]">Style</label>
                <select
                  value={imageStyleEdit}
                  onChange={(e) => setImageStyleEdit(e.target.value)}
                  className="w-full rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-1 text-[11px] text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="photo">Photo</option>
                  <option value="illustration">Illustration</option>
                  <option value="icon">Icon</option>
                  <option value="abstract">Abstract</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-muted)]">Ratio</label>
                <select
                  value={imageRatioEdit}
                  onChange={(e) => setImageRatioEdit(e.target.value)}
                  className="w-full rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-1.5 py-1 text-[11px] text-[var(--text-primary)] focus:outline-none"
                >
                  <option value="1:1">1:1</option>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="4:3">4:3</option>
                  <option value="3:4">3:4</option>
                  <option value="3:2">3:2</option>
                  <option value="21:9">21:9</option>
                </select>
              </div>
            </div>
            {!getStoredGoogleApiKey() ? (
              <p className="mt-auto rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-400">
                Add a Google AI API key in Settings to generate images.
              </p>
            ) : (
              <button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePromptEdit.trim()}
                className="mt-auto flex items-center justify-center gap-1.5 rounded bg-[var(--studio-accent)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-on-accent)] transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Generating...
                  </>
                ) : selected.imageSrc && !isPlaceholderSrc(selected.imageSrc) ? (
                  "Regenerate"
                ) : (
                  "Generate"
                )}
              </button>
            )}
          </div>
        )}

        {activeSection === "text" && (
          <>
            <PropertyRow label="Font Family" value={cs.fontFamily ?? ""} cssProp="fontFamily" onApply={applyStyle} type="select" options={[cs.fontFamily ?? "", ...[...fontFamilySet].filter((f) => f !== cs.fontFamily)]} />
            <PropertyRow label="Weight" value={cs.fontWeight ?? ""} cssProp="fontWeight" onApply={applyStyle} type="select" options={["100", "200", "300", "400", "500", "600", "700", "800", "900"]} />
            <PropertyRow label="Size" value={cs.fontSize ?? ""} cssProp="fontSize" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Line Height" value={cs.lineHeight ?? ""} cssProp="lineHeight" onApply={applyStyle} />
            <PropertyRow label="Spacing" value={cs.letterSpacing ?? ""} cssProp="letterSpacing" onApply={applyStyle} />
            <PropertyRow label="Text Colour" value={cs.color ?? ""} cssProp="color" onApply={applyStyle} type="color" tokenSuggestions={colorTokens} />
            <PropertyRow label="Align" value={cs.textAlign ?? ""} cssProp="textAlign" onApply={applyStyle} type="select" options={["left", "center", "right", "justify"]} />
          </>
        )}

        {activeSection === "colours" && (
          <>
            <PropertyRow label="Background" value={cs.backgroundColor ?? ""} cssProp="backgroundColor" onApply={applyStyle} type="color" tokenSuggestions={colorTokens} />
            <PropertyRow label="Text" value={cs.color ?? ""} cssProp="color" onApply={applyStyle} type="color" tokenSuggestions={colorTokens} />
            <PropertyRow label="Border" value={cs.borderColor ?? ""} cssProp="borderColor" onApply={applyStyle} type="color" tokenSuggestions={colorTokens} />
            <PropertyRow label="Opacity" value={cs.opacity ?? "1"} cssProp="opacity" onApply={applyStyle} />
          </>
        )}

        {activeSection === "spacing" && (
          <>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Padding</div>
            <PropertyRow label="Top" value={cs.paddingTop ?? ""} cssProp="paddingTop" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Right" value={cs.paddingRight ?? ""} cssProp="paddingRight" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Bottom" value={cs.paddingBottom ?? ""} cssProp="paddingBottom" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Left" value={cs.paddingLeft ?? ""} cssProp="paddingLeft" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 mt-2">Margin</div>
            <PropertyRow label="Top" value={cs.marginTop ?? ""} cssProp="marginTop" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Right" value={cs.marginRight ?? ""} cssProp="marginRight" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Bottom" value={cs.marginBottom ?? ""} cssProp="marginBottom" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Left" value={cs.marginLeft ?? ""} cssProp="marginLeft" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1 mt-2">Layout</div>
            <GapSelect value={cs.gap ?? ""} spacingTokens={spacingTokens} onApply={applyStyle} />
          </>
        )}

        {activeSection === "size" && (
          <>
            <PropertyRow label="Width" value={cs.width ?? ""} cssProp="width" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Height" value={cs.height ?? ""} cssProp="height" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Max Width" value={cs.maxWidth ?? ""} cssProp="maxWidth" onApply={applyStyle} tokenSuggestions={spacingTokens} />
            <PropertyRow label="Radius" value={cs.borderRadius ?? ""} cssProp="borderRadius" onApply={applyStyle} />
            <PropertyRow label="Border Width" value={cs.borderWidth ?? ""} cssProp="borderWidth" onApply={applyStyle} />
            <PropertyRow label="Display" value={cs.display ?? ""} cssProp="display" onApply={applyStyle} type="select" options={["block", "flex", "grid", "inline", "inline-flex", "inline-block", "none"]} />
            <PropertyRow label="Direction" value={cs.flexDirection ?? ""} cssProp="flexDirection" onApply={applyStyle} type="select" options={["row", "column", "row-reverse", "column-reverse"]} />
            <PropertyRow label="Align" value={cs.alignItems ?? ""} cssProp="alignItems" onApply={applyStyle} type="select" options={["stretch", "flex-start", "flex-end", "center", "baseline"]} />
            <PropertyRow label="Justify" value={cs.justifyContent ?? ""} cssProp="justifyContent" onApply={applyStyle} type="select" options={["flex-start", "flex-end", "center", "space-between", "space-around", "space-evenly"]} />
          </>
        )}

        {activeSection === "annotate" && (
          <>
            <div className="text-[11px] text-[var(--text-secondary)] mb-2">
              Add a note about what to change on this &lt;{selected.elementTag}&gt;
            </div>
            <div className="flex gap-1.5">
              <textarea
                value={annotationText}
                onChange={(e) => setAnnotationText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddAnnotation(); } }}
                placeholder="e.g. make this bigger, use brand colour..."
                rows={4}
                className="flex-1 rounded bg-[var(--bg-surface)] border border-[var(--studio-border)] px-2.5 py-2 text-[12px] leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--studio-border-focus)] resize-none"
              />
              <button
                onClick={handleAddAnnotation}
                disabled={!annotationText.trim()}
                className="self-end rounded bg-purple-500/20 p-2 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-30"
              >
                <MessageSquarePlus size={16} />
              </button>
            </div>
            {annotations.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                  {annotations.length} note{annotations.length !== 1 ? "s" : ""} queued
                </div>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {annotations.map((ann, i) => (
                    <div key={i} className="flex items-start gap-1.5 rounded bg-purple-500/5 px-2 py-1.5">
                      <span className="text-[10px] text-purple-400 shrink-0">&lt;{ann.elementTag}&gt;</span>
                      <span className="text-[10px] text-[var(--text-secondary)] flex-1">{ann.note}</span>
                      <button
                        onClick={() => setAnnotations((prev) => prev.filter((_, j) => j !== i))}
                        className="shrink-0 text-[var(--text-muted)] hover:text-red-400"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Apply / Discard / Submit buttons */}
      {(pendingEdits.length > 0 || annotations.length > 0) && (
        <div className="flex gap-1.5 border-t border-[var(--studio-border)] px-2.5 py-2">
          {pendingEdits.length > 0 && (
            <>
              <button
                onClick={() => { setPendingEdits([]); onReset?.(); }}
                className="rounded-md border border-[var(--studio-border)] px-2.5 py-1.5 text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleApplyAll}
                className="flex-1 rounded-md bg-[var(--studio-accent)] px-3 py-1.5 text-[10px] font-medium text-[var(--text-on-accent)] hover:bg-[var(--studio-accent-hover)] transition-colors"
              >
                Apply {pendingEdits.length} change{pendingEdits.length !== 1 ? "s" : ""}
              </button>
            </>
          )}
          {annotations.length > 0 && onAnnotationsSubmit && (
            <button
              onClick={handleSubmitAnnotations}
              className="flex-1 flex items-center justify-center gap-1 rounded-md bg-purple-500/20 px-3 py-1.5 text-[10px] font-medium text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              <Send size={10} />
              Push {annotations.length} to AI
            </button>
          )}
        </div>
      )}

      {/* Resize handle — bottom-right corner */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
        style={{ touchAction: "none" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="text-[var(--text-muted)] opacity-40 hover:opacity-80 transition-opacity">
          <path d="M14 14L8 14M14 14L14 8M14 14L6 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
