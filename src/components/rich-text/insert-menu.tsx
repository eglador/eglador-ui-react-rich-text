"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import type { LexicalCommand } from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  PlusIcon,
  HorizontalRuleIcon,
  PageBreakIcon,
  TableIcon,
  ChevronLeftIcon,
} from "../../lib/icons";
import { INSERT_PAGE_BREAK_COMMAND } from "./page-break";

type InsertView = "main" | "table";

interface InsertMenuProps {
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
  /** Maximum rows in the table size picker (default `8`) */
  tableMaxRows?: number;
  /** Maximum columns in the table size picker (default `8`) */
  tableMaxCols?: number;
}

/**
 * Dropdown menu for inserting block-level content (horizontal rule,
 * page break, table). Designed to grow with future image / embed options.
 *
 * Tables open a sub-view with a grid picker (Notion / Google-Docs pattern):
 * hover to highlight an N×M selection, click to insert.
 */
export function InsertMenu({
  sizeClass = "size-8",
  tableMaxRows = 8,
  tableMaxCols = 8,
}: InsertMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<InsertView>("main");

  // Reset view when popover closes
  React.useEffect(() => {
    if (!open) setView("main");
  }, [open]);

  const dispatch = (command: LexicalCommand<undefined>) => {
    editor.dispatchCommand(command, undefined);
    setOpen(false);
  };

  const insertTable = (rows: number, cols: number) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      rows: String(rows),
      columns: String(cols),
      includeHeaders: { rows: false, columns: true },
    });
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      preserveSelection
      trigger={
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          title="Insert"
          aria-label="Insert"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-center rounded transition-colors cursor-pointer",
            sizeClass,
            "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
            open && "bg-zinc-200 text-zinc-900",
          )}
        >
          <PlusIcon className="size-4" />
        </button>
      }
      contentClassName="rounded-lg border border-zinc-200 bg-white shadow-lg p-1"
    >
      {view === "main" ? (
        <div className="w-48">
          <MenuOption
            label="Horizontal rule"
            icon={<HorizontalRuleIcon className="size-4" />}
            onClick={() => dispatch(INSERT_HORIZONTAL_RULE_COMMAND)}
          />
          <MenuOption
            label="Page break"
            icon={<PageBreakIcon className="size-4" />}
            onClick={() => dispatch(INSERT_PAGE_BREAK_COMMAND)}
          />
          <MenuOption
            label="Table"
            icon={<TableIcon className="size-4" />}
            onClick={() => setView("table")}
          />
        </div>
      ) : (
        <TableSizePicker
          maxRows={tableMaxRows}
          maxCols={tableMaxCols}
          onSelect={insertTable}
          onBack={() => setView("main")}
        />
      )}
    </Popover>
  );
}

InsertMenu.displayName = "InsertMenu";

interface MenuOptionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function MenuOption({ label, icon, onClick }: MenuOptionProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}

interface TableSizePickerProps {
  maxRows: number;
  maxCols: number;
  onSelect: (rows: number, cols: number) => void;
  onBack: () => void;
}

function TableSizePicker({
  maxRows,
  maxCols,
  onSelect,
  onBack,
}: TableSizePickerProps) {
  const [hover, setHover] = React.useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });

  return (
    <div className="p-1.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="inline-flex items-center justify-center size-6 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
        >
          <ChevronLeftIcon className="size-4" />
        </button>
        <span className="text-xs text-zinc-600 tabular-nums">
          {hover.row || 0} × {hover.col || 0}
        </span>
      </div>
      <div
        role="grid"
        aria-label="Table size"
        onMouseLeave={() => setHover({ row: 0, col: 0 })}
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${maxCols}, 1.25rem)`,
        }}
      >
        {Array.from({ length: maxRows * maxCols }).map((_, i) => {
          const row = Math.floor(i / maxCols) + 1;
          const col = (i % maxCols) + 1;
          const active = row <= hover.row && col <= hover.col;
          return (
            <button
              key={i}
              type="button"
              role="gridcell"
              aria-label={`${row} × ${col}`}
              onMouseEnter={() => setHover({ row, col })}
              onClick={() => onSelect(row, col)}
              className={cn(
                "size-5 border rounded-sm cursor-pointer transition-colors",
                active
                  ? "bg-blue-500 border-blue-600"
                  : "bg-white border-zinc-200 hover:border-zinc-400",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
