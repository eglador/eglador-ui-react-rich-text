"use client";

import * as React from "react";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $createParagraphNode,
  $isParagraphNode,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { GripVerticalIcon, PlusIcon } from "../../lib/icons";
import { BlockPicker } from "./block-picker";
import { useMessages } from "./i18n";
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
 * Put an empty paragraph right after the hovered block and place the
 * caret in it, so a subsequent `action` (which converts the focused
 * block) or `renderForm` submit (which inserts at the selection) lands
 * below that block rather than wherever the caret happened to be.
 *
 * @returns the placeholder's key, so a cancelled form can clean it up.
 */
function anchorAfter(
  editor: LexicalEditor,
  domElement: HTMLElement,
): NodeKey | null {
  let key: NodeKey | null = null;
  editor.update(() => {
    const node = $getNearestNodeFromDOMNode(domElement);
    if (!node) return;
    const target = node.getTopLevelElement();
    if (!target) return;
    const placeholder = $createParagraphNode();
    target.insertAfter(placeholder);
    placeholder.selectEnd();
    key = placeholder.getKey();
  });
  return key;
}

/** Drop a placeholder paragraph that was never filled in (form cancelled). */
function removeIfEmptyPlaceholder(editor: LexicalEditor, key: NodeKey | null) {
  if (!key) return;
  editor.update(() => {
    const node = $getNodeByKey(key);
    if ($isParagraphNode(node) && node.getTextContentSize() === 0) {
      node.remove();
    }
  });
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
  const t = useMessages();
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

  // Spec whose form is showing as a sub-view, plus the placeholder
  // paragraph its submit will fill.
  const [formSpec, setFormSpec] = React.useState<BlockSpec | null>(null);
  const placeholderKeyRef = React.useRef<NodeKey | null>(null);

  React.useEffect(() => {
    if (!open) setFormSpec(null);
  }, [open]);

  const discardPlaceholder = React.useCallback(() => {
    removeIfEmptyPlaceholder(editor, placeholderKeyRef.current);
    placeholderKeyRef.current = null;
  }, [editor]);

  const closeAll = React.useCallback(() => {
    placeholderKeyRef.current = null;
    setFormSpec(null);
    setOpen(false);
  }, []);

  /**
   * Any close that isn't a successful insert drops the placeholder
   * paragraph the form was going to fill. Escape and outside-clicks come
   * through here, which is why the cleanup can't live in the form's
   * Cancel handler alone — pressing Escape used to leave a blank line
   * behind.
   */
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!next) discardPlaceholder();
      setOpen(next);
    },
    [discardPlaceholder],
  );

  const handleSelect = React.useCallback(
    (spec: BlockSpec) => {
      const target = insertTargetRef.current;
      if (!target) return;

      // Form wins when both exist — same precedence as the toolbar
      // Insert dropdown and the slash menu.
      if (typeof spec.renderForm === "function") {
        placeholderKeyRef.current = anchorAfter(editor, target);
        setFormSpec(spec);
        return;
      }

      setOpen(false);
      if (typeof spec.action === "function") {
        anchorAfter(editor, target);
        spec.action(editor);
      }
    },
    [editor],
  );

  const cancelForm = React.useCallback(() => {
    discardPlaceholder();
    closeAll();
  }, [discardPlaceholder, closeAll]);

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
              onOpenChange={handleOpenChange}
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
              contentClassName="rounded-lg border border-zinc-200 bg-white shadow-lg overflow-hidden"
            >
              {formSpec && formSpec.renderForm ? (
                formSpec.renderForm(editor, {
                  onComplete: closeAll,
                  onCancel: cancelForm,
                })
              ) : (
                <BlockPicker
                  blocks={draggableBlocks}
                  onSelect={handleSelect}
                  searchPlaceholder={t.searchBlocks}
                  emptyLabel={t.noBlocksFound}
                />
              )}
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
