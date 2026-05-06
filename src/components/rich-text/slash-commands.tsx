"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  type LexicalEditor,
  type TextNode,
  type ElementNode,
} from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { cn } from "../../lib/utils";
import {
  PilcrowIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListBulletIcon,
  ListOrderedIcon,
  ListCheckIcon,
  QuoteIcon,
  CodeIcon,
  HorizontalRuleIcon,
  PageBreakIcon,
  TableIcon,
} from "../../lib/icons";
import { INSERT_PAGE_BREAK_COMMAND } from "./page-break";

interface CommandConfig {
  title: string;
  description: string;
  iconNode: React.ReactElement;
  keywords: string[];
  action: (editor: LexicalEditor) => void;
}

class SlashCommandOption extends MenuOption {
  title: string;
  description: string;
  iconNode: React.ReactElement;
  keywords: string[];
  action: (editor: LexicalEditor) => void;

  constructor(config: CommandConfig) {
    super(config.title);
    this.title = config.title;
    this.description = config.description;
    this.iconNode = config.iconNode;
    this.keywords = config.keywords;
    this.action = config.action;
  }
}

function setBlock<T extends ElementNode>(
  editor: LexicalEditor,
  factory: () => T,
) {
  editor.update(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $setBlocksType(selection, factory);
  });
}

const COMMANDS: CommandConfig[] = [
  {
    title: "Paragraph",
    description: "Plain text",
    iconNode: <PilcrowIcon className="size-4" />,
    keywords: ["text", "p", "paragraph"],
    action: (editor) => setBlock(editor, () => $createParagraphNode()),
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    iconNode: <Heading1Icon className="size-4" />,
    keywords: ["h1", "title", "heading"],
    action: (editor) => setBlock(editor, () => $createHeadingNode("h1")),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    iconNode: <Heading2Icon className="size-4" />,
    keywords: ["h2", "subtitle", "heading"],
    action: (editor) => setBlock(editor, () => $createHeadingNode("h2")),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    iconNode: <Heading3Icon className="size-4" />,
    keywords: ["h3", "heading"],
    action: (editor) => setBlock(editor, () => $createHeadingNode("h3")),
  },
  {
    title: "Bullet list",
    description: "Unordered items",
    iconNode: <ListBulletIcon className="size-4" />,
    keywords: ["ul", "unordered", "list", "bullet"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    title: "Numbered list",
    description: "Ordered items",
    iconNode: <ListOrderedIcon className="size-4" />,
    keywords: ["ol", "ordered", "list", "number"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    title: "Check list",
    description: "Tasks with checkboxes",
    iconNode: <ListCheckIcon className="size-4" />,
    keywords: ["check", "todo", "task", "checkbox"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  },
  {
    title: "Quote",
    description: "Highlighted block of text",
    iconNode: <QuoteIcon className="size-4" />,
    keywords: ["quote", "blockquote", "citation"],
    action: (editor) => setBlock(editor, () => $createQuoteNode()),
  },
  {
    title: "Code block",
    description: "Syntax-highlighted code",
    iconNode: <CodeIcon className="size-4" />,
    keywords: ["code", "snippet", "pre"],
    action: (editor) => setBlock(editor, () => $createCodeNode()),
  },
  {
    title: "Divider",
    description: "Horizontal separator",
    iconNode: <HorizontalRuleIcon className="size-4" />,
    keywords: ["hr", "rule", "divider", "separator"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    title: "Page break",
    description: "Print / PDF break",
    iconNode: <PageBreakIcon className="size-4" />,
    keywords: ["pagebreak", "print", "pdf"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined),
  },
  {
    title: "Table",
    description: "3×3 grid",
    iconNode: <TableIcon className="size-4" />,
    keywords: ["table", "grid", "cells"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: "3",
        columns: "3",
        includeHeaders: { rows: false, columns: true },
      }),
  },
];

/**
 * Slash command menu — type `/` in the editor to open a popover with quick
 * block insertions (Notion / Linear / Discord pattern).
 *
 * Built on Lexical's `LexicalTypeaheadMenuPlugin` so arrow keys, Enter,
 * Escape, mouse hover, and outside-click are handled automatically.
 *
 * Opt-in: render inside `<RichTextEditor>` to enable.
 *
 * ```tsx
 * <RichTextEditor>
 *   <RichTextToolbar />
 *   <RichTextContent />
 *   <RichTextSlashCommands />
 * </RichTextEditor>
 * ```
 */
export function RichTextSlashCommands() {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = React.useState<string | null>(null);

  const allOptions = React.useMemo(
    () => COMMANDS.map((cmd) => new SlashCommandOption(cmd)),
    [],
  );

  const options = React.useMemo(() => {
    if (!queryString) return allOptions;
    const lower = queryString.toLowerCase();
    return allOptions.filter(
      (o) =>
        o.title.toLowerCase().includes(lower) ||
        o.keywords.some((k) => k.toLowerCase().includes(lower)),
    );
  }, [queryString, allOptions]);

  const triggerFn = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

  const onSelectOption = React.useCallback(
    (
      selected: SlashCommandOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
      });
      selected.action(editor);
      closeMenu();
    },
    [editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={triggerFn}
      options={options}
      menuRenderFn={(anchorElementRef, itemProps) => {
        const { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex } =
          itemProps;
        if (!anchorElementRef.current || options.length === 0) return null;

        return createPortal(
          <div
            role="menu"
            aria-label="Slash commands"
            className="absolute z-[9999] w-72 rounded-lg border border-zinc-200 bg-white shadow-xl p-1 max-h-80 overflow-y-auto"
          >
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-100 mb-1">
              Insert block
            </div>
            {options.map((option, i) => (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                ref={option.setRefElement}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setHighlightedIndex(i);
                  selectOptionAndCleanUp(option);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={cn(
                  "flex items-center gap-3 w-full px-2 py-1.5 rounded text-sm cursor-pointer",
                  selectedIndex === i
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-50",
                )}
              >
                <span className="inline-flex items-center justify-center size-8 rounded border border-zinc-200 bg-white text-zinc-600 shrink-0">
                  {option.iconNode}
                </span>
                <span className="flex flex-col items-start min-w-0">
                  <span className="font-medium truncate">{option.title}</span>
                  <span className="text-xs text-zinc-500 truncate">
                    {option.description}
                  </span>
                </span>
              </button>
            ))}
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}

RichTextSlashCommands.displayName = "RichTextSlashCommands";
