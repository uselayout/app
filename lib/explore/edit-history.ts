import type { EditEntry, EditHistory, StyleEdit, ElementAnnotation } from "@/lib/types";

const MAX_HISTORY_ENTRIES = 50;

function generateId(): string {
  return `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pushEdit(
  history: EditHistory,
  entry: Omit<EditEntry, "id" | "timestamp">
): EditHistory {
  const newEntry: EditEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };
  const updated = [...history, newEntry];
  if (updated.length > MAX_HISTORY_ENTRIES) {
    return updated.slice(updated.length - MAX_HISTORY_ENTRIES);
  }
  return updated;
}

export function pushManualEdit(
  history: EditHistory,
  codeBefore: string,
  codeAfter: string,
  styleChanges: StyleEdit[],
  description: string
): EditHistory {
  return pushEdit(history, {
    type: "manual",
    description,
    codeBefore,
    codeAfter,
    styleChanges,
  });
}

export function pushAiEdit(
  history: EditHistory,
  codeBefore: string,
  codeAfter: string,
  annotations: ElementAnnotation[],
  description: string
): EditHistory {
  return pushEdit(history, {
    type: "ai-annotation",
    description,
    codeBefore,
    codeAfter,
    annotations,
  });
}

export function pushRollback(
  history: EditHistory,
  codeBefore: string,
  targetEntry: EditEntry
): EditHistory {
  return pushEdit(history, {
    type: "rollback",
    description: `Rolled back to: ${targetEntry.description}`,
    codeBefore,
    codeAfter: targetEntry.codeAfter,
  });
}

export function getCodeAtEntry(history: EditHistory, entryId: string): string | null {
  const entry = history.find((e) => e.id === entryId);
  return entry?.codeAfter ?? null;
}

export function undoLastEdit(history: EditHistory): {
  history: EditHistory;
  restoredCode: string | null;
} {
  if (history.length === 0) {
    return { history, restoredCode: null };
  }
  const lastEntry = history[history.length - 1];
  const newHistory = pushEdit(history, {
    type: "rollback",
    description: `Undo: ${lastEntry.description}`,
    codeBefore: lastEntry.codeAfter,
    codeAfter: lastEntry.codeBefore,
  });
  return { history: newHistory, restoredCode: lastEntry.codeBefore };
}
