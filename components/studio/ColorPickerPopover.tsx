"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { toHex } from "@/lib/util/color";

interface ColorPickerPopoverProps {
  value: string;
  onChange: (newValue: string) => void;
  children: React.ReactNode;
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [hexInput, setHexInput] = useState(value);
  const hexValue = toHex(value) ?? "#000000";

  // Sync input when value changes externally
  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const handlePickerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const hex = e.target.value;
      setHexInput(hex);
      onChange(hex);
    },
    [onChange]
  );

  const handleTextCommit = useCallback(() => {
    const trimmed = hexInput.trim();
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    }
  }, [hexInput, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleTextCommit();
      }
    },
    [handleTextCommit]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-auto border-[var(--studio-border)] bg-[var(--bg-elevated)] p-3"
      >
        <div className="flex flex-col gap-2">
          <input
            type="color"
            value={hexValue}
            onChange={handlePickerChange}
            className="h-24 w-36 cursor-pointer rounded border border-[var(--studio-border)] bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleTextCommit}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-36 rounded border border-[var(--studio-border)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--studio-border-focus)] transition-colors"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
