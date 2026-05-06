"use client";

import * as React from "react";
import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNearestNodeFromDOMNode,
  $createParagraphNode,
  $isElementNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $createListNode, $createListItemNode } from "@lexical/list";
import { $createCodeNode } from "@lexical/code";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  GripVerticalIcon,
  PlusIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  PilcrowIcon,
  ListBulletIcon,
  ListOrderedIcon,
  QuoteIcon,
  CodeIcon,
} from "../../lib/icons";

const DRAGGABLE_BLOCK_MENU_CLASSNAME = "rich-text-draggable-block-menu";

function isOnMenu(element: HTMLElement): boolean {
  return Boolean(element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`));
}

type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "numberedList"
  | "quote"
  | "code";

const BLOCK_OPTIONS: Array<{
  type: BlockType;
  label: string;
  icon: React.ReactNode;
}> = [
  { type: "paragraph", label: "Paragraph", icon: <PilcrowIcon className="size-4" /> },
  { type: "h1", label: "Heading 1", icon: <Heading1Icon className="size-4" /> },
  { type: "h2", label: "Heading 2", icon: <Heading2Icon className="size-4" /> },
  { type: "h3", label: "Heading 3", icon: <Heading3Icon className="size-4" /> },
  { type: "bulletList", label: "Bullet list", icon: <ListBulletIcon className="size-4" /> },
  { type: "numberedList", label: "Numbered list", icon: <ListOrderedIcon className="size-4" /> },
  { type: "quote", label: "Quote", icon: <QuoteIcon className="size-4" /> },
  { type: "code", label: "Code block", icon: <CodeIcon className="size-4" /> },
];

function createBlockNode(type: BlockType): LexicalNode {
  switch (type) {
    case "h1":
    case "h2":
    case "h3":
      return $createHeadingNode(type as HeadingTagType);
    case "quote":
      return $createQuoteNode();
    case "bulletList": {
      const list = $createListNode("bullet");
      list.append($createListItemNode());
      return list;
    }
    case "numberedList": {
      const list = $createListNode("number");
      list.append($createListItemNode());
      return list;
    }
    case "code":
      return $createCodeNode();
    case "paragraph":
    default:
      return $createParagraphNode();
  }
}

function insertBlockAt(
  editor: LexicalEditor,
  domElement: HTMLElement,
  type: BlockType,
) {
  editor.update(() => {
    const node = $getNearestNodeFromDOMNode(domElement);
    if (!node) return;

    const target = node.getTopLevelElement();
    if (!target) return;

    const newBlock = createBlockNode(type);
    target.insertAfter(newBlock);

    if ($isElementNode(newBlock)) {
      newBlock.selectEnd();
    }
  });
}

interface RichTextDraggableBlockProps {
  anchorElem: HTMLElement;
  /** Hide the "+" insert button (default `false` — button is shown) */
  hideInsertButton?: boolean;
}

/**
 * Notion-style drag handle with an optional "+" insert menu.
 * Hover over a block → grip handle appears on the left, drag to reorder.
 * Click "+" to insert a new block (heading, list, quote, code, ...) below.
 */
export function RichTextDraggableBlock({
  anchorElem,
  hideInsertButton = false,
}: RichTextDraggableBlockProps) {
  const [editor] = useLexicalComposerContext();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const targetLineRef = React.useRef<HTMLDivElement>(null);
  const [activeElement, setActiveElement] =
    React.useState<HTMLElement | null>(null);
  const [open, setOpen] = React.useState(false);

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
    (type: BlockType) => {
      setOpen(false);
      const target = insertTargetRef.current;
      if (!target) return;
      insertBlockAt(editor, target, type);
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
              contentClassName="w-48 rounded-lg border border-zinc-200 bg-white shadow-lg p-1"
            >
              {BLOCK_OPTIONS.map((option) => (
                <button
                  key={option.type}
                  type="button"
                  role="menuitem"
                  onClick={() => handleInsert(option.type)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                >
                  <span className="text-zinc-500">{option.icon}</span>
                  {option.label}
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
