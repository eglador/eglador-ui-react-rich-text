"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { SearchIcon } from "../../lib/icons";
import type { BlockSpec } from "./blocks-registry";

/** Match a block against a typed query — label first, then keywords. */
export function filterBlocks(blocks: BlockSpec[], query: string): BlockSpec[] {
  const q = query.trim().toLowerCase();
  if (!q) return blocks;
  return blocks.filter(
    (b) =>
      b.label.toLowerCase().includes(q) ||
      (b.keywords ?? []).some((k) => k.toLowerCase().includes(q)),
  );
}

export interface BlockPickerProps {
  blocks: BlockSpec[];
  onSelect: (spec: BlockSpec) => void;
  /** Placeholder for the search field. */
  searchPlaceholder: string;
  /** Shown when the query matches nothing. */
  emptyLabel: string;
  className?: string;
}

/**
 * Searchable block list used by the "+" surfaces.
 *
 * The search field takes focus on mount so the list can be narrowed by
 * typing straight after opening the menu; ↑/↓ move the highlight and
 * Enter picks. Kept separate from the popovers themselves so the
 * drag-handle "+" and the toolbar Insert dropdown behave identically.
 */
export function BlockPicker({
  blocks,
  onSelect,
  searchPlaceholder,
  emptyLabel,
  className,
}: BlockPickerProps) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // `autoFocus` alone loses the race here: the popover mounts into a
  // portal and positions itself on the next frame, and the editor pulls
  // focus back in between — so typing straight after opening the menu
  // went into the document instead of the filter. Claim focus once the
  // popover has settled.
  React.useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const results = React.useMemo(
    () => filterBlocks(blocks, query),
    [blocks, query],
  );

  // A narrowed list can be shorter than the previous highlight index.
  React.useEffect(() => {
    setActive((i) => (i >= results.length ? 0 : i));
  }, [results.length]);

  // Keep the highlighted row in view while arrowing through a long list.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length === 0 ? 0 : (i - 1 + results.length) % results.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const spec = results[active];
      if (spec) onSelect(spec);
    }
    // Escape deliberately bubbles: the surrounding popover closes on it
    // and runs its own cleanup.
  };

  return (
    <div className={cn("w-64", className)} onKeyDown={handleKeyDown}>
      <div className="flex items-center gap-1.5 border-b border-zinc-100 px-2 py-1.5">
        <SearchIcon className="size-3.5 shrink-0 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          aria-label={searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>

      <div
        ref={listRef}
        role="menu"
        className="max-h-72 overflow-y-auto p-1"
      >
        {results.length === 0 ? (
          <p className="px-2 py-3 text-center text-xs text-zinc-400">
            {emptyLabel}
          </p>
        ) : (
          results.map((spec, i) => (
            <button
              key={spec.key}
              type="button"
              role="menuitem"
              data-index={i}
              onClick={() => onSelect(spec)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-left text-sm",
                i === active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-50",
              )}
            >
              <span className="shrink-0 text-zinc-500">{spec.icon}</span>
              <span className="truncate">{spec.label}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

BlockPicker.displayName = "BlockPicker";
