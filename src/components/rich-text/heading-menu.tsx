"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
} from "lexical";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  PilcrowIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
} from "../../lib/icons";

export type HeadingMenuItem =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

type Option = {
  value: HeadingMenuItem;
  label: string;
  icon: React.ReactNode;
};

const ALL_OPTIONS: Option[] = [
  { value: "paragraph", label: "Paragraph", icon: <PilcrowIcon className="size-4" /> },
  { value: "h1", label: "Heading 1", icon: <Heading1Icon className="size-4" /> },
  { value: "h2", label: "Heading 2", icon: <Heading2Icon className="size-4" /> },
  { value: "h3", label: "Heading 3", icon: <Heading3Icon className="size-4" /> },
  { value: "h4", label: "Heading 4", icon: <Heading4Icon className="size-4" /> },
  { value: "h5", label: "Heading 5", icon: <Heading5Icon className="size-4" /> },
  { value: "h6", label: "Heading 6", icon: <Heading6Icon className="size-4" /> },
];

export const DEFAULT_HEADING_ITEMS: HeadingMenuItem[] = ALL_OPTIONS.map(
  (o) => o.value,
);

const ICON_BY_VALUE: Record<HeadingMenuItem, React.ReactNode> = {
  paragraph: <PilcrowIcon className="size-4" />,
  h1: <Heading1Icon className="size-4" />,
  h2: <Heading2Icon className="size-4" />,
  h3: <Heading3Icon className="size-4" />,
  h4: <Heading4Icon className="size-4" />,
  h5: <Heading5Icon className="size-4" />,
  h6: <Heading6Icon className="size-4" />,
};

interface HeadingMenuProps {
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
  /** Items shown in the dropdown (default: paragraph + h1–h6) */
  items?: HeadingMenuItem[];
}

/**
 * Dropdown menu for paragraph / heading block selection.
 * Trigger shows the current block's icon, dropdown lists `items`
 * with the active one highlighted.
 */
export function HeadingMenu({
  sizeClass = "size-8",
  items = DEFAULT_HEADING_ITEMS,
}: HeadingMenuProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [current, setCurrent] = React.useState<HeadingMenuItem>("paragraph");
  const visibleOptions = React.useMemo(
    () => ALL_OPTIONS.filter((o) => items.includes(o.value)),
    [items],
  );

  const updateCurrent = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const anchor = selection.anchor.getNode();
      const element =
        anchor.getKey() === "root"
          ? anchor
          : anchor.getTopLevelElementOrThrow();
      if ($isHeadingNode(element)) {
        const tag = element.getTag();
        if (
          tag === "h1" ||
          tag === "h2" ||
          tag === "h3" ||
          tag === "h4" ||
          tag === "h5" ||
          tag === "h6"
        ) {
          setCurrent(tag);
          return;
        }
      }
      setCurrent("paragraph");
    });
  }, [editor]);

  React.useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => updateCurrent());
    });
  }, [editor, updateCurrent]);

  const apply = (value: HeadingMenuItem) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      if (value === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
      } else {
        $setBlocksType(selection, () =>
          $createHeadingNode(value as HeadingTagType),
        );
      }
    });
    setOpen(false);
  };

  const triggerIcon = ICON_BY_VALUE[current];

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
          title="Block type"
          aria-label="Block type"
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
      {visibleOptions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="menuitem"
          onClick={() => apply(opt.value)}
          className={cn(
            "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer",
            current === opt.value && "bg-zinc-100 text-zinc-900",
          )}
        >
          <span className="text-zinc-500">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </Popover>
  );
}

HeadingMenu.displayName = "HeadingMenu";
