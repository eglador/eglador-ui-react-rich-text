"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { mergeRegister } from "@lexical/utils";
import { $isLinkNode } from "@lexical/link";
import {
  $createHeadingNode,
  $isHeadingNode,
  type HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { cn } from "../../lib/utils";
import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
  LinkIcon,
  BaselineIcon,
  HighlighterIcon,
} from "../../lib/icons";
import {
  ColorPicker,
  TEXT_COLOR_PRESETS,
  BG_COLOR_PRESETS,
} from "./color-picker";
import { LinkEditPopover } from "./link-edit-popover";
import { TextCaseMenu } from "./text-case-menu";

interface RichTextFloatingToolbarProps {
  /** Element used as positioning anchor (typically the editor's content wrapper) */
  anchorElem: HTMLElement;
  /**
   * Heading buttons offered next to the inline formats. Each one turns
   * the selected block into that heading, or back into a paragraph when
   * it already is one. Pass `[]` to leave them out.
   */
  headings?: HeadingTagType[];
}

type FloatingState = {
  visible: boolean;
  top: number;
  left: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  link: boolean;
  /** `"paragraph"`, a heading tag, or whatever else the block is. */
  blockType: string;
};

const initialState: FloatingState = {
  visible: false,
  top: 0,
  left: 0,
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  link: false,
  blockType: "paragraph",
};

/**
 * Floating selection toolbar — appears above the selected text with format
 * buttons (bold, italic, underline, strikethrough, code, link).
 */
export function RichTextFloatingToolbar({
  anchorElem,
  headings = ["h2", "h3"],
}: RichTextFloatingToolbarProps) {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = React.useState<FloatingState>(initialState);
  const [linkOpen, setLinkOpen] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  // While the link editor popover is open, the input takes DOM focus and
  // window selection collapses. We must keep the toolbar mounted so the
  // popover (which is rendered as the link button's child) stays alive.
  const linkOpenRef = React.useRef(linkOpen);
  React.useEffect(() => {
    linkOpenRef.current = linkOpen;
  }, [linkOpen]);

  const updatePosition = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (
        !$isRangeSelection(selection) ||
        selection.isCollapsed() ||
        editor.getRootElement() === null
      ) {
        if (!linkOpenRef.current) {
          setState((s) => ({ ...s, visible: false }));
        }
        return;
      }

      const node = selection.anchor.getNode();
      const parent = node.getParent();
      const isLink = $isLinkNode(node) || $isLinkNode(parent);

      const block = node.getTopLevelElement();
      const blockType = $isHeadingNode(block)
        ? block.getTag()
        : (block?.getType() ?? "paragraph");

      const next = {
        blockType,
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        strikethrough: selection.hasFormat("strikethrough"),
        code: selection.hasFormat("code"),
        link: isLink,
      };

      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) return;
      const rangeRect = domSelection.getRangeAt(0).getBoundingClientRect();
      if (rangeRect.width === 0 && rangeRect.height === 0) return;

      const anchorRect = anchorElem.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current?.offsetHeight ?? 36;

      const top = rangeRect.top - anchorRect.top - toolbarHeight - 8;
      const left =
        rangeRect.left - anchorRect.left + rangeRect.width / 2;

      setState({
        visible: true,
        top,
        left,
        ...next,
      });
    });
  }, [editor, anchorElem]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePosition();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updatePosition();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updatePosition]);

  React.useEffect(() => {
    const onScroll = () => updatePosition();
    document.addEventListener("scroll", onScroll, true);
    return () => document.removeEventListener("scroll", onScroll, true);
  }, [updatePosition]);

  /** Toggle the selected block between a heading and a paragraph. */
  const toggleHeading = (tag: HeadingTagType) => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () =>
        state.blockType === tag ? $createParagraphNode() : $createHeadingNode(tag),
      );
    });
  };

  const dispatchFormat = (
    format: "bold" | "italic" | "underline" | "strikethrough" | "code",
  ) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  if (!state.visible) return null;

  return createPortal(
    <div
      ref={toolbarRef}
      role="toolbar"
      aria-label="Selection formatting"
      className="absolute z-50 flex items-center gap-0.5 px-1 py-1 rounded-lg border border-zinc-200 bg-white shadow-lg -translate-x-1/2"
      style={{ top: state.top, left: state.left }}
    >
      <FloatingButton
        label="Bold"
        icon={<BoldIcon className="size-4" />}
        active={state.bold}
        onClick={() => dispatchFormat("bold")}
      />
      <FloatingButton
        label="Italic"
        icon={<ItalicIcon className="size-4" />}
        active={state.italic}
        onClick={() => dispatchFormat("italic")}
      />
      <FloatingButton
        label="Underline"
        icon={<UnderlineIcon className="size-4" />}
        active={state.underline}
        onClick={() => dispatchFormat("underline")}
      />
      <FloatingButton
        label="Strikethrough"
        icon={<StrikethroughIcon className="size-4" />}
        active={state.strikethrough}
        onClick={() => dispatchFormat("strikethrough")}
      />
      <FloatingButton
        label="Inline code"
        icon={<CodeIcon className="size-4" />}
        active={state.code}
        onClick={() => dispatchFormat("code")}
      />
      <TextCaseMenu />
      {headings.length > 0 && (
        <>
          <div className="w-px h-5 bg-zinc-200 mx-0.5" aria-hidden="true" />
          {headings.map((tag) => (
            <FloatingButton
              key={tag}
              label={`Heading ${tag.slice(1)}`}
              icon={HEADING_ICONS[tag] ?? <Heading2Icon className="size-4" />}
              active={state.blockType === tag}
              onClick={() => toggleHeading(tag)}
            />
          ))}
        </>
      )}
      <div className="w-px h-5 bg-zinc-200 mx-0.5" aria-hidden="true" />
      <ColorPicker
        label="Text color"
        icon={<BaselineIcon className="size-4" />}
        property="color"
        presets={TEXT_COLOR_PRESETS}
        sizeClass="size-7"
      />
      <ColorPicker
        label="Highlight color"
        icon={<HighlighterIcon className="size-4" />}
        property="background-color"
        presets={BG_COLOR_PRESETS}
        sizeClass="size-7"
      />
      <div className="w-px h-5 bg-zinc-200 mx-0.5" aria-hidden="true" />
      <LinkEditPopover
        open={linkOpen}
        onOpenChange={setLinkOpen}
        trigger={
          <FloatingButton
            label="Link"
            icon={<LinkIcon className="size-4" />}
            active={state.link}
            onClick={() => setLinkOpen((o) => !o)}
          />
        }
      />
    </div>,
    anchorElem,
  );
}

RichTextFloatingToolbar.displayName = "RichTextFloatingToolbar";

const HEADING_ICONS: Partial<Record<HeadingTagType, React.ReactNode>> = {
  h1: <Heading1Icon className="size-4" />,
  h2: <Heading2Icon className="size-4" />,
  h3: <Heading3Icon className="size-4" />,
  h4: <Heading4Icon className="size-4" />,
  h5: <Heading5Icon className="size-4" />,
  h6: <Heading6Icon className="size-4" />,
};

interface FloatingButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

function FloatingButton({ label, icon, onClick, active }: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Use onMouseDown to prevent the editor selection from being lost
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "inline-flex items-center justify-center size-7 rounded transition-colors cursor-pointer",
        "text-zinc-700 hover:bg-zinc-100",
        active && "bg-zinc-200 text-zinc-900",
      )}
    >
      {icon}
    </button>
  );
}
