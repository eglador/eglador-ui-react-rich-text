"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { PlusIcon } from "../../lib/icons";
import {
  type BlockSpec,
  defaultBlocks,
  getBlocksForSurface,
} from "./blocks-registry";

interface InsertMenuProps {
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
  /**
   * Custom blocks registry. Defaults to `defaultBlocks`. Use this to
   * extend, re-order, or restrict the items shown in the dropdown — only
   * blocks with `surfaces.includes("insert")` are picked up.
   *
   * Each spec drives its own row: a spec with `renderForm` opens that
   * form as a sub-view; a spec with only `action` runs immediately.
   */
  blocks?: BlockSpec[];
}

/**
 * Top-toolbar Insert dropdown. Driven entirely by the unified
 * `BlockSpec` registry — every entry whose `surfaces` includes
 * `"insert"` shows up here.
 *
 * - If a spec has `renderForm`, clicking it pushes a sub-view with that form.
 * - Otherwise, clicking dispatches `action(editor)` and closes.
 */
export function InsertMenu({
  sizeClass = "size-8",
  blocks = defaultBlocks,
}: InsertMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [activeKey, setActiveKey] = React.useState<string | null>(null);

  const insertBlocks = React.useMemo(
    () => getBlocksForSurface("insert", blocks),
    [blocks],
  );

  React.useEffect(() => {
    if (!open) setActiveKey(null);
  }, [open]);

  const close = React.useCallback(() => {
    setOpen(false);
    setActiveKey(null);
  }, []);

  const back = React.useCallback(() => {
    setActiveKey(null);
  }, []);

  const handleSelect = (spec: BlockSpec) => {
    if (spec.renderForm) {
      setActiveKey(spec.key);
      return;
    }
    if (typeof spec.action === "function") {
      spec.action(editor);
      close();
    }
  };

  const activeSpec = activeKey
    ? insertBlocks.find((b) => b.key === activeKey) ?? null
    : null;

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
      contentClassName="rounded-lg border border-zinc-200 bg-white shadow-lg overflow-hidden"
    >
      {activeSpec && activeSpec.renderForm ? (
        activeSpec.renderForm(editor, { onComplete: close, onCancel: back })
      ) : (
        <div className="w-56 p-1 max-h-80 overflow-y-auto">
          {insertBlocks.map((spec) => (
            <button
              key={spec.key}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(spec)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
            >
              <span className="text-zinc-500">{spec.icon}</span>
              <span className="truncate">{spec.label}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

InsertMenu.displayName = "InsertMenu";
