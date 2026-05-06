"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  FORMAT_ELEMENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  type ElementFormatType,
} from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  AlignJustifyIcon,
  AlignStartIcon,
  AlignEndIcon,
  IndentIncreaseIcon,
  IndentDecreaseIcon,
} from "../../lib/icons";

type AlignOption = {
  value: ElementFormatType;
  label: string;
  icon: React.ReactNode;
};

const ALIGN_OPTIONS: AlignOption[] = [
  { value: "left", label: "Align left", icon: <AlignLeftIcon className="size-4" /> },
  { value: "center", label: "Align center", icon: <AlignCenterIcon className="size-4" /> },
  { value: "right", label: "Align right", icon: <AlignRightIcon className="size-4" /> },
  { value: "justify", label: "Justify", icon: <AlignJustifyIcon className="size-4" /> },
  { value: "start", label: "Align start", icon: <AlignStartIcon className="size-4" /> },
  { value: "end", label: "Align end", icon: <AlignEndIcon className="size-4" /> },
];

const ICON_BY_VALUE: Record<string, React.ReactNode> = {
  left: <AlignLeftIcon className="size-4" />,
  center: <AlignCenterIcon className="size-4" />,
  right: <AlignRightIcon className="size-4" />,
  justify: <AlignJustifyIcon className="size-4" />,
  start: <AlignStartIcon className="size-4" />,
  end: <AlignEndIcon className="size-4" />,
};

interface AlignmentMenuProps {
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
}

/**
 * Dropdown menu for block alignment (left/center/right/justify/start/end)
 * plus indent / outdent. Uses Lexical's standard `FORMAT_ELEMENT_COMMAND`
 * and `INDENT_CONTENT_COMMAND` / `OUTDENT_CONTENT_COMMAND`.
 */
export function AlignmentMenu({ sizeClass = "size-8" }: AlignmentMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [currentAlign, setCurrentAlign] =
    React.useState<ElementFormatType>("left");

  const updateAlign = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElement();
      if (element && $isElementNode(element)) {
        const format = element.getFormatType();
        setCurrentAlign((format || "left") as ElementFormatType);
      }
    });
  }, [editor]);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateAlign());
    });
  }, [editor, updateAlign]);

  const applyAlign = (value: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    setOpen(false);
  };

  const triggerIcon = ICON_BY_VALUE[currentAlign] ?? ICON_BY_VALUE.left;

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
          title="Alignment"
          aria-label="Alignment"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-center rounded transition-colors cursor-pointer",
            sizeClass,
            "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
            open && "bg-zinc-200 text-zinc-900",
          )}
        >
          {triggerIcon}
        </button>
      }
      contentClassName="w-44 rounded-lg border border-zinc-200 bg-white shadow-lg p-1"
    >
      {ALIGN_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="menuitem"
          onClick={() => applyAlign(opt.value)}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer",
            currentAlign === opt.value && "bg-zinc-100 text-zinc-900",
          )}
        >
          <span className="text-zinc-500">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
      <div className="h-px bg-zinc-200 my-1" />
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          setOpen(false);
        }}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
      >
        <span className="text-zinc-500">
          <IndentDecreaseIcon className="size-4" />
        </span>
        Outdent
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          setOpen(false);
        }}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
      >
        <span className="text-zinc-500">
          <IndentIncreaseIcon className="size-4" />
        </span>
        Indent
      </button>
    </Popover>
  );
}

AlignmentMenu.displayName = "AlignmentMenu";
