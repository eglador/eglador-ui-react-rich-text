"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalNode,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { cn } from "../../lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ColumnInsertLeftIcon,
  ColumnInsertRightIcon,
  ColumnRemoveIcon,
  TrashIcon,
} from "../../lib/icons";
import {
  $createColumnNode,
  $isColumnNode,
  $isColumnsNode,
  COLUMNS_MAX,
  COLUMNS_MIN,
  type ColumnNode,
  type ColumnsGap,
  type ColumnsNode,
} from "./columns-node";

interface RichTextColumnsToolbarProps {
  /** Element used as positioning anchor (typically the editor's content wrapper) */
  anchorElem: HTMLElement;
}

interface ActiveColumns {
  columnsKey: string;
  columnKey: string;
  columnIndex: number;
  count: number;
  gap: ColumnsGap;
  mobileStack: boolean;
  top: number;
  left: number;
}

function findActive(
  startNode: LexicalNode,
): { columns: ColumnsNode; column: ColumnNode; index: number } | null {
  let n: LexicalNode | null = startNode;
  let column: ColumnNode | null = null;
  while (n) {
    if (!column && $isColumnNode(n)) column = n;
    if ($isColumnsNode(n)) {
      if (!column) return null;
      const index = n
        .getChildren()
        .findIndex((c) => c.getKey() === column!.getKey());
      return { columns: n, column, index };
    }
    n = n.getParent();
  }
  return null;
}

/**
 * Floating toolbar shown above the active `ColumnsNode` whenever the
 * cursor is inside one of its columns. Provides table-like contextual
 * column operations (insert L/R, move L/R, delete this column) plus
 * block-level options (gap, mobile stack, delete all).
 */
export function RichTextColumnsToolbar({
  anchorElem,
}: RichTextColumnsToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = React.useState<ActiveColumns | null>(null);

  const update = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setActive(null);
        return;
      }

      const result = findActive(selection.anchor.getNode());
      if (!result) {
        setActive(null);
        return;
      }

      const elem = editor.getElementByKey(result.columns.getKey());
      if (!elem) {
        setActive(null);
        return;
      }

      const rect = elem.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const above = rect.top - anchorRect.top - 44;
      const below = rect.bottom - anchorRect.top + 8;

      setActive({
        columnsKey: result.columns.getKey(),
        columnKey: result.column.getKey(),
        columnIndex: result.index,
        count: result.columns.getCount(),
        gap: result.columns.getGap(),
        mobileStack: result.columns.getMobileStack(),
        top: above >= 0 ? above : below,
        left: rect.left - anchorRect.left,
      });
    });
  }, [editor, anchorElem]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => update()),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, update]);

  React.useEffect(() => {
    const handler = () => update();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [update]);

  const mutate = React.useCallback(
    (fn: (columns: ColumnsNode, column: ColumnNode) => void) => {
      if (!active) return;
      editor.update(() => {
        const columns = $getNodeByKey(active.columnsKey);
        const column = $getNodeByKey(active.columnKey);
        if ($isColumnsNode(columns) && $isColumnNode(column)) {
          fn(columns, column);
        }
      });
    },
    [editor, active],
  );

  const insertColumnLeft = () =>
    mutate((columns, column) => {
      if (columns.getCount() >= COLUMNS_MAX) return;
      const newCol = $createColumnNode();
      newCol.append($createParagraphNode());
      column.insertBefore(newCol);
      columns.setCount(columns.getCount() + 1);
    });

  const insertColumnRight = () =>
    mutate((columns, column) => {
      if (columns.getCount() >= COLUMNS_MAX) return;
      const newCol = $createColumnNode();
      newCol.append($createParagraphNode());
      column.insertAfter(newCol);
      columns.setCount(columns.getCount() + 1);
    });

  const moveColumnLeft = () =>
    mutate((_columns, column) => {
      const prev = column.getPreviousSibling();
      if (prev) prev.insertBefore(column);
    });

  const moveColumnRight = () =>
    mutate((_columns, column) => {
      const next = column.getNextSibling();
      if (next) next.insertAfter(column);
    });

  const deleteColumn = () =>
    mutate((columns, column) => {
      if (columns.getCount() <= COLUMNS_MIN) return;
      column.remove();
      columns.setCount(columns.getCount() - 1);
    });

  const setGap = (gap: ColumnsGap) =>
    mutate((columns) => columns.setGap(gap));

  const toggleStack = () =>
    mutate((columns) => columns.setMobileStack(!columns.getMobileStack()));

  const removeColumns = () => mutate((columns) => columns.remove());

  if (!active) return null;

  const isFirst = active.columnIndex === 0;
  const isLast = active.columnIndex === active.count - 1;
  const atMax = active.count >= COLUMNS_MAX;
  const atMin = active.count <= COLUMNS_MIN;

  return createPortal(
    <div
      role="toolbar"
      aria-label="Columns layout"
      onMouseDown={(e) => {
        const target = e.target as Element | null;
        if (target?.matches('input, select, [contenteditable="true"]')) return;
        e.preventDefault();
      }}
      className="absolute z-30 inline-flex items-center gap-0.5 px-1 py-1 rounded-lg border border-zinc-200 bg-white shadow-md flex-wrap"
      style={{ top: active.top, left: active.left }}
    >
      <ToolbarButton
        label="Insert column left"
        onClick={insertColumnLeft}
        disabled={atMax}
      >
        <ColumnInsertLeftIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Insert column right"
        onClick={insertColumnRight}
        disabled={atMax}
      >
        <ColumnInsertRightIcon className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <span className="inline-flex items-center px-1.5 text-xs font-medium text-zinc-700 tabular-nums">
        Col {active.columnIndex + 1}/{active.count}
      </span>

      <Divider />

      <ToolbarButton
        label="Move column left"
        onClick={moveColumnLeft}
        disabled={isFirst}
      >
        <ChevronLeftIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Move column right"
        onClick={moveColumnRight}
        disabled={isLast}
      >
        <ChevronRightIcon className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Delete this column"
        onClick={deleteColumn}
        disabled={atMin}
        variant="danger"
      >
        <ColumnRemoveIcon className="size-3.5" />
      </ToolbarButton>

      <Divider />

      <select
        value={active.gap}
        onChange={(e) => setGap(e.target.value as ColumnsGap)}
        title="Gap"
        className="px-1.5 py-1 text-xs border border-zinc-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
      >
        <option value="small">Small gap</option>
        <option value="medium">Medium gap</option>
        <option value="large">Large gap</option>
      </select>

      <button
        type="button"
        onClick={toggleStack}
        aria-pressed={active.mobileStack}
        title="Stack on mobile (< 768px)"
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer",
          active.mobileStack
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-50",
        )}
      >
        <span
          className={cn(
            "inline-block size-2 rounded-sm",
            active.mobileStack ? "bg-blue-600" : "bg-zinc-300",
          )}
        />
        Stack
      </button>

      <Divider />

      <ToolbarButton
        label="Delete entire columns block"
        onClick={removeColumns}
        variant="danger"
      >
        <TrashIcon className="size-3.5" />
      </ToolbarButton>
    </div>,
    anchorElem,
  );
}

RichTextColumnsToolbar.displayName = "RichTextColumnsToolbar";

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
  children: React.ReactNode;
}

function ToolbarButton({
  label,
  onClick,
  disabled,
  variant = "default",
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center justify-center size-7 rounded transition-colors cursor-pointer",
        variant === "default" && "text-zinc-700 hover:bg-zinc-100",
        variant === "danger" && "text-red-600 hover:bg-red-50",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <span className="w-px h-5 bg-zinc-200 mx-0.5" aria-hidden="true" />
  );
}
