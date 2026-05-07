"use client";

import * as React from "react";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $createParagraphNode,
  type LexicalEditor,
} from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { GripVerticalIcon, PlusIcon } from "../../lib/icons";
import {
  type BlockSpec,
  defaultBlocks,
  getBlocksForSurface,
} from "./blocks-registry";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "rich-text-draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
  return Boolean(element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`));
}

/**
 * Insert a fresh paragraph after the target block, focus into it, then
 * run the spec's action (which typically converts the focused block via
 * `$setBlocksType`, or dispatches an insert command). This unifies the
 * "insert after hovered block" semantics with the registry's
 * selection-based action contract.
 */
function insertBlockAfter(
  editor: LexicalEditor,
  domElement: HTMLElement,
  spec: BlockSpec,
) {
  if (typeof spec.action !== "function") return;
  editor.update(() => {
    const node = $getNearestNodeFromDOMNode(domElement);
    if (!node) return;
    const target = node.getTopLevelElement();
    if (!target) return;
    const placeholder = $createParagraphNode();
    target.insertAfter(placeholder);
    placeholder.selectEnd();
  });
  spec.action(editor);
}

interface RichTextDraggableBlockProps {
  anchorElem: HTMLElement;
  /** Hide the "+" insert button (default `false` — button is shown) */
  hideInsertButton?: boolean;
  /**
   * Custom blocks registry. Defaults to `defaultBlocks` filtered to
   * `surfaces.includes("draggable")` and `action` defined.
   */
  blocks?: BlockSpec[];
}

/**
 * Notion-style drag handle with an optional "+" insert menu.
 * Hover over a block → grip handle appears on the left, drag to reorder.
 * Click "+" to insert a new block from the registry's draggable surface.
 */
export function RichTextDraggableBlock({
  anchorElem,
  hideInsertButton = false,
  blocks = defaultBlocks,
}: RichTextDraggableBlockProps) {
  const [editor] = useLexicalComposerContext();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const targetLineRef = React.useRef<HTMLDivElement>(null);
  const [activeElement, setActiveElement] =
    React.useState<HTMLElement | null>(null);
  const [open, setOpen] = React.useState(false);

  const draggableBlocks = React.useMemo(
    () => getBlocksForSurface("draggable", blocks),
    [blocks],
  );

  // Capture the active block when the popover opens, then freeze it so
  // hover-driven `activeElement` changes (caused by the user moving toward
  // the portaled popover, which counts as off-block) don't shift the
  // insertion target. While the popover is closed, the ref tracks the
  // current hover; opening locks it for the duration of the insertion.
  const insertTargetRef = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    if (!open) insertTargetRef.current = activeElement;
  }, [open, activeElement]);

  const handleInsert = React.useCallback(
    (spec: BlockSpec) => {
      setOpen(false);
      const target = insertTargetRef.current;
      if (!target) return;
      insertBlockAfter(editor, target, spec);
    },
    [editor],
  );

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      onElementChanged={setActiveElement}
      menuComponent={
        <div
          ref={menuRef}
          className={cn(
            DRAGGABLE_BLOCK_MENU_CLASSNAME,
            "absolute left-0 top-0 flex items-center gap-0.5 opacity-0 will-change-transform transition-opacity",
          )}
        >
          {!hideInsertButton && (
            <Popover
              open={open}
              onOpenChange={setOpen}
              placement="bottom-start"
              trigger={
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="flex items-center justify-center size-6 rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
                  aria-label="Insert block"
                  aria-haspopup="menu"
                  aria-expanded={open}
                >
                  <PlusIcon className="size-4" />
                </button>
              }
              contentClassName="w-56 rounded-lg border border-zinc-200 bg-white shadow-lg p-1 max-h-80 overflow-y-auto"
            >
              {draggableBlocks.map((spec) => (
                <button
                  key={spec.key}
                  type="button"
                  role="menuitem"
                  onClick={() => handleInsert(spec)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <span className="text-zinc-500">{spec.icon}</span>
                  <span className="truncate">{spec.label}</span>
                </button>
              ))}
            </Popover>
          )}
          <div
            className="flex items-center justify-center size-6 rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVerticalIcon className="size-4" />
          </div>
        </div>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          className="pointer-events-none absolute left-0 top-0 h-1 bg-blue-500 rounded-full opacity-0 will-change-transform"
        />
      }
      isOnMenu={isOnMenu}
    />
  );
}

RichTextDraggableBlock.displayName = "RichTextDraggableBlock";
