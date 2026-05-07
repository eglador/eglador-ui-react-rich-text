"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ChevronLeftIcon } from "../../lib/icons";

interface TableSizePickerProps {
  maxRows?: number;
  maxCols?: number;
  onSelect: (rows: number, cols: number) => void;
  onBack?: () => void;
}

/**
 * Notion / Google-Docs style table size picker. Hover over the grid to
 * highlight an N×M selection, click to insert. Used as the `renderForm`
 * for the `table` block in the insert surface.
 */
export function TableSizePicker({
  maxRows = 8,
  maxCols = 8,
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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="inline-flex items-center justify-center size-6 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
          >
            <ChevronLeftIcon className="size-4" />
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs text-zinc-600 tabular-nums">
          {hover.row || 0} × {hover.col || 0}
        </span>
      </div>
      <div
        role="grid"
        aria-label="Table size"
        onMouseLeave={() => setHover({ row: 0, col: 0 })}
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${maxCols}, 1.25rem)` }}
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

TableSizePicker.displayName = "TableSizePicker";
