"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type LexicalEditor,
  type RangeSelection,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { $isLinkNode } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import { cn } from "../../lib/utils";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  PilcrowIcon,
  QuoteIcon,
  ListBulletIcon,
  ListOrderedIcon,
  LinkIcon,
  UndoIcon,
  RedoIcon,
  BaselineIcon,
  HighlighterIcon,
} from "../../lib/icons";
import {
  ColorPicker,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
} from "./color-picker";
import { AlignmentMenu } from "./alignment-menu";
import { HeadingMenu } from "./heading-menu";
import { InsertMenu } from "./insert-menu";
import { LinkEditPopover } from "./link-edit-popover";
import { TextTransformMenu } from "./text-transform-menu";

export type RichTextToolbarFeature =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "heading1"
  | "heading2"
  | "heading3"
  | "heading4"
  | "heading5"
  | "heading6"
  | "heading"
  | "paragraph"
  | "quote"
  | "bulletList"
  | "orderedList"
  | "link"
  | "textColor"
  | "backgroundColor"
  | "alignment"
  | "textTransform"
  | "insert"
  | "undo"
  | "redo"
  | "separator";

const DEFAULT_FEATURES: RichTextToolbarFeature[] = [
  "undo",
  "redo",
  "separator",
  "heading",
  "separator",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "textTransform",
  "separator",
  "textColor",
  "backgroundColor",
  "separator",
  "bulletList",
  "orderedList",
  "separator",
  "alignment",
  "separator",
  "quote",
  "link",
  "separator",
  "insert",
];

export interface RichTextToolbarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  features?: RichTextToolbarFeature[];
}

type BlockType = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote" | "ul" | "ol" | "code" | "other";

type ActiveState = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  subscript: boolean;
  superscript: boolean;
  highlight: boolean;
  link: boolean;
  blockType: BlockType;
  canUndo: boolean;
  canRedo: boolean;
};

const initialState: ActiveState = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  subscript: false,
  superscript: false,
  highlight: false,
  link: false,
  blockType: "paragraph",
  canUndo: false,
  canRedo: false,
};

function getBlockType(selection: RangeSelection): BlockType {
  const anchorNode = selection.anchor.getNode();
  const element =
    anchorNode.getKey() === "root"
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow();

  if ($isHeadingNode(element)) {
    return element.getTag() as BlockType;
  }
  if ($isQuoteNode(element)) return "quote";
  if ($isListNode(element)) {
    return element.getListType() === "number" ? "ol" : "ul";
  }
  return "paragraph";
}

function isLinkSelection(selection: RangeSelection): boolean {
  const node = selection.anchor.getNode();
  const parent = node.getParent();
  return $isLinkNode(node) || $isLinkNode(parent);
}

export function RichTextToolbar({
  features = DEFAULT_FEATURES,
  className,
  ...props
}: RichTextToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = React.useState<ActiveState>(initialState);

  const updateState = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      // Compute values synchronously inside read() — setActive's updater
      // runs later (outside read scope), so we can't pass node refs into it.
      const next = {
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        strikethrough: selection.hasFormat("strikethrough"),
        code: selection.hasFormat("code"),
        subscript: selection.hasFormat("subscript"),
        superscript: selection.hasFormat("superscript"),
        highlight: selection.hasFormat("highlight"),
        link: isLinkSelection(selection),
        blockType: getBlockType(selection),
      };
      setActive((prev) => ({ ...prev, ...next }));
    });
  }, [editor]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateState();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (canUndo) => {
          setActive((s) => ({ ...s, canUndo }));
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (canRedo) => {
          setActive((s) => ({ ...s, canRedo }));
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [editor, updateState]);

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 px-2 py-1.5 border-b border-zinc-200 bg-zinc-50 flex-wrap",
        className,
      )}
      role="toolbar"
      aria-label="Formatting toolbar"
      {...props}
    >
      {features.map((feature, i) => renderFeature(feature, i, editor, active))}
    </div>
  );
}

RichTextToolbar.displayName = "RichTextToolbar";

// ─── Helpers ────────────────────────────────

function renderFeature(
  feature: RichTextToolbarFeature,
  index: number,
  editor: LexicalEditor,
  active: ActiveState,
) {
  const key = `${feature}-${index}`;

  switch (feature) {
    case "separator":
      return <Separator key={key} />;

    case "undo":
      return (
        <ToolbarButton
          key={key}
          label="Undo"
          icon={<UndoIcon className="size-4" />}
          disabled={!active.canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        />
      );
    case "redo":
      return (
        <ToolbarButton
          key={key}
          label="Redo"
          icon={<RedoIcon className="size-4" />}
          disabled={!active.canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        />
      );

    case "bold":
      return (
        <ToolbarButton
          key={key}
          label="Bold"
          icon={<BoldIcon className="size-4" />}
          active={active.bold}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        />
      );
    case "italic":
      return (
        <ToolbarButton
          key={key}
          label="Italic"
          icon={<ItalicIcon className="size-4" />}
          active={active.italic}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        />
      );
    case "underline":
      return (
        <ToolbarButton
          key={key}
          label="Underline"
          icon={<UnderlineIcon className="size-4" />}
          active={active.underline}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        />
      );
    case "strikethrough":
      return (
        <ToolbarButton
          key={key}
          label="Strikethrough"
          icon={<StrikethroughIcon className="size-4" />}
          active={active.strikethrough}
          onClick={() =>
            editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")
          }
        />
      );
    case "code":
      return (
        <ToolbarButton
          key={key}
          label="Inline code"
          icon={<CodeIcon className="size-4" />}
          active={active.code}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        />
      );

    case "paragraph":
      return (
        <ToolbarButton
          key={key}
          label="Paragraph"
          icon={<PilcrowIcon className="size-4" />}
          active={active.blockType === "paragraph"}
          onClick={() => formatBlock(editor, "paragraph")}
        />
      );
    case "heading1":
      return (
        <ToolbarButton
          key={key}
          label="Heading 1"
          icon={<Heading1Icon className="size-4" />}
          active={active.blockType === "h1"}
          onClick={() => formatBlock(editor, "h1")}
        />
      );
    case "heading2":
      return (
        <ToolbarButton
          key={key}
          label="Heading 2"
          icon={<Heading2Icon className="size-4" />}
          active={active.blockType === "h2"}
          onClick={() => formatBlock(editor, "h2")}
        />
      );
    case "heading3":
      return (
        <ToolbarButton
          key={key}
          label="Heading 3"
          icon={<Heading3Icon className="size-4" />}
          active={active.blockType === "h3"}
          onClick={() => formatBlock(editor, "h3")}
        />
      );
    case "heading4":
      return (
        <ToolbarButton
          key={key}
          label="Heading 4"
          icon={<Heading4Icon className="size-4" />}
          active={active.blockType === "h4"}
          onClick={() => formatBlock(editor, "h4")}
        />
      );
    case "heading5":
      return (
        <ToolbarButton
          key={key}
          label="Heading 5"
          icon={<Heading5Icon className="size-4" />}
          active={active.blockType === "h5"}
          onClick={() => formatBlock(editor, "h5")}
        />
      );
    case "heading6":
      return (
        <ToolbarButton
          key={key}
          label="Heading 6"
          icon={<Heading6Icon className="size-4" />}
          active={active.blockType === "h6"}
          onClick={() => formatBlock(editor, "h6")}
        />
      );
    case "quote":
      return (
        <ToolbarButton
          key={key}
          label="Quote"
          icon={<QuoteIcon className="size-4" />}
          active={active.blockType === "quote"}
          onClick={() => formatBlock(editor, "quote")}
        />
      );

    case "bulletList":
      return (
        <ToolbarButton
          key={key}
          label="Bullet list"
          icon={<ListBulletIcon className="size-4" />}
          active={active.blockType === "ul"}
          onClick={() => toggleList(editor, "ul", active.blockType === "ul")}
        />
      );
    case "orderedList":
      return (
        <ToolbarButton
          key={key}
          label="Ordered list"
          icon={<ListOrderedIcon className="size-4" />}
          active={active.blockType === "ol"}
          onClick={() => toggleList(editor, "ol", active.blockType === "ol")}
        />
      );

    case "link":
      return <LinkButton key={key} active={active.link} />;

    case "textColor":
      return (
        <ColorPicker
          key={key}
          label="Text color"
          icon={<BaselineIcon className="size-4" />}
          property="color"
          presets={TEXT_COLOR_PRESETS}
        />
      );
    case "backgroundColor":
      return (
        <ColorPicker
          key={key}
          label="Highlight color"
          icon={<HighlighterIcon className="size-4" />}
          property="background-color"
          presets={BG_COLOR_PRESETS}
        />
      );

    case "alignment":
      return <AlignmentMenu key={key} />;

    case "heading":
      return <HeadingMenu key={key} />;

    case "insert":
      return <InsertMenu key={key} />;

    case "textTransform":
      return (
        <TextTransformMenu
          key={key}
          active={{
            strikethrough: active.strikethrough,
            subscript: active.subscript,
            superscript: active.superscript,
            highlight: active.highlight,
          }}
        />
      );

    default:
      return null;
  }
}

function formatBlock(
  editor: LexicalEditor,
  type: "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "quote",
) {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    if (type === "paragraph") {
      $setBlocksType(selection, () => $createParagraphNode());
    } else if (type === "quote") {
      $setBlocksType(selection, () => $createQuoteNode());
    } else {
      $setBlocksType(selection, () =>
        $createHeadingNode(type as HeadingTagType),
      );
    }
  });
}

function toggleList(
  editor: LexicalEditor,
  type: "ul" | "ol",
  isActive: boolean,
) {
  if (isActive) {
    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  } else if (type === "ul") {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  } else {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }
}

// ─── Sub-components ─────────────────────────

function LinkButton({ active }: { active: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <LinkEditPopover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <ToolbarButton
          label="Link"
          icon={<LinkIcon className="size-4" />}
          active={active}
          onClick={() => setOpen((o) => !o)}
        />
      }
    />
  );
}

function Separator() {
  return <div className="w-px h-6 bg-zinc-200 mx-1" aria-hidden="true" />;
}

interface ToolbarButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

function ToolbarButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center size-8 rounded-md transition-colors cursor-pointer",
        "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
        active && "bg-zinc-200 text-zinc-900",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-700",
      )}
    >
      {icon}
    </button>
  );
}
