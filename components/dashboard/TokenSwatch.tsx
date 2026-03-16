"use client";

import { useState, useRef, useEffect } from "react";
import type { DesignToken, DesignTokenType } from "@/lib/types/token";

interface TokenSwatchProps {
  token: DesignToken;
  onUpdate: (tokenId: string, value: string) => void;
  onDelete: (tokenId: string) => void;
}

export function TokenSwatch({ token, onUpdate, onDelete }: TokenSwatchProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(token.value);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(token.value);
  }, [token.value]);

  function handleStartEdit() {
    setEditValue(token.value);
    setEditing(true);
  }

  function handleSave() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== token.value) {
      onUpdate(token.id, trimmed);
    }
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(token.value);
      setEditing(false);
    }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(token.id);
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  }

  const renderer = getRenderer(token.type);

  return renderer({
    token,
    editing,
    editValue,
    inputRef,
    onStartEdit: handleStartEdit,
    onSave: handleSave,
    onKeyDown: handleKeyDown,
    onEditValueChange: setEditValue,
    onDeleteClick: handleDeleteClick,
    confirmDelete,
  });
}

interface RenderProps {
  token: DesignToken;
  editing: boolean;
  editValue: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStartEdit: () => void;
  onSave: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onEditValueChange: (value: string) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
  confirmDelete: boolean;
}

function DeleteButton({
  onDeleteClick,
  confirmDelete,
}: {
  onDeleteClick: (e: React.MouseEvent) => void;
  confirmDelete: boolean;
}) {
  return (
    <button
      onClick={onDeleteClick}
      className={`rounded-[var(--studio-radius-sm)] px-2 py-1 text-xs transition-all duration-[var(--duration-base)] ${
        confirmDelete
          ? "bg-[var(--status-error)] text-white"
          : "bg-[var(--bg-hover)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--status-error)]"
      }`}
    >
      {confirmDelete ? "Confirm" : "Delete"}
    </button>
  );
}

function ValueDisplay({
  editing,
  editValue,
  inputRef,
  onStartEdit,
  onSave,
  onKeyDown,
  onEditValueChange,
  token,
}: RenderProps) {
  if (editing) {
    return (
      <input
        ref={inputRef}
        value={editValue}
        onChange={(e) => onEditValueChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={onKeyDown}
        className="w-full rounded-[var(--studio-radius-sm)] border border-[var(--studio-border-focus)] bg-[var(--bg-elevated)] px-2 py-1 text-sm text-[var(--text-primary)] outline-none"
      />
    );
  }

  return (
    <button
      onClick={onStartEdit}
      className="cursor-pointer text-left text-sm text-[var(--text-secondary)] transition-all duration-[var(--duration-base)] hover:text-[var(--text-primary)]"
      title="Click to edit"
    >
      {token.value}
    </button>
  );
}

function ColorSwatch(props: RenderProps) {
  const { token, onDeleteClick, confirmDelete } = props;

  return (
    <div className="group flex flex-col items-start gap-2">
      <button
        onClick={props.onStartEdit}
        className="h-9 w-9 shrink-0 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)]"
        style={{ backgroundColor: token.value }}
        title={`Click to edit — ${token.value}`}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
          {token.name}
        </p>
        <div className="mt-0.5">
          <ValueDisplay {...props} />
        </div>
        {token.cssVariable && (
          <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]">
            {token.cssVariable}
          </p>
        )}
      </div>
      <DeleteButton onDeleteClick={onDeleteClick} confirmDelete={confirmDelete} />
    </div>
  );
}

function BarSwatch(props: RenderProps) {
  const { token, onDeleteClick, confirmDelete } = props;
  const numericValue = parseFloat(token.value);
  const barWidth = !isNaN(numericValue) ? Math.min(numericValue * 4, 200) : 40;

  return (
    <div className="group flex items-center gap-4 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
      <div
        className="h-4 shrink-0 rounded-sm bg-[var(--studio-accent)]"
        style={{ width: `${barWidth}px` }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{token.name}</p>
        <div className="flex items-center gap-2">
          <ValueDisplay {...props} />
          {token.cssVariable && (
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {token.cssVariable}
            </span>
          )}
        </div>
      </div>
      <DeleteButton onDeleteClick={onDeleteClick} confirmDelete={confirmDelete} />
    </div>
  );
}

function TypographySwatch(props: RenderProps) {
  const { token, onDeleteClick, confirmDelete } = props;

  return (
    <div className="group flex items-center gap-4 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
      <p
        className="w-32 shrink-0 truncate text-[var(--text-primary)]"
        style={{ fontSize: token.value }}
      >
        Aa Bb Cc
      </p>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{token.name}</p>
        <div className="flex items-center gap-2">
          <ValueDisplay {...props} />
          {token.cssVariable && (
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {token.cssVariable}
            </span>
          )}
        </div>
      </div>
      <DeleteButton onDeleteClick={onDeleteClick} confirmDelete={confirmDelete} />
    </div>
  );
}

function EffectSwatch(props: RenderProps) {
  const { token, onDeleteClick, confirmDelete } = props;

  return (
    <div className="group flex items-center gap-4 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
      <div
        className="h-10 w-10 shrink-0 rounded-[var(--studio-radius-sm)] bg-[var(--bg-elevated)]"
        style={{ boxShadow: token.value }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{token.name}</p>
        <div className="flex items-center gap-2">
          <ValueDisplay {...props} />
          {token.cssVariable && (
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {token.cssVariable}
            </span>
          )}
        </div>
      </div>
      <DeleteButton onDeleteClick={onDeleteClick} confirmDelete={confirmDelete} />
    </div>
  );
}

function MotionSwatch(props: RenderProps) {
  const { token, onDeleteClick, confirmDelete } = props;

  return (
    <div className="group flex items-center gap-4 rounded-[var(--studio-radius-md)] border border-[var(--studio-border)] bg-[var(--bg-surface)] px-3 py-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--studio-radius-sm)] bg-[var(--bg-elevated)]">
        <span className="font-mono text-xs text-[var(--text-muted)]">M</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{token.name}</p>
        <div className="flex items-center gap-2">
          <ValueDisplay {...props} />
          {token.cssVariable && (
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {token.cssVariable}
            </span>
          )}
        </div>
      </div>
      <DeleteButton onDeleteClick={onDeleteClick} confirmDelete={confirmDelete} />
    </div>
  );
}

function getRenderer(type: DesignTokenType): (props: RenderProps) => React.ReactNode {
  switch (type) {
    case "color":
      return ColorSwatch;
    case "spacing":
    case "radius":
      return BarSwatch;
    case "typography":
      return TypographySwatch;
    case "effect":
      return EffectSwatch;
    case "motion":
      return MotionSwatch;
  }
}
