"use client";

import * as React from "react";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  type ElementNode,
  type LexicalEditor,
} from "lexical";
import { DateTimeForm, formatDateTime } from "./date-time-form";
import {
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  AudioLinesIcon,
  CalendarClockIcon,
  CodeIcon,
  Columns3Icon,
  FrameIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  HorizontalRuleIcon,
  ImageIcon,
  ListBulletIcon,
  ListCheckIcon,
  ListOrderedIcon,
  PageBreakIcon,
  PilcrowIcon,
  QuoteIcon,
  SplitViewIcon,
  TableIcon,
  VideoIcon,
  YouTubeIcon,
} from "../../lib/icons";
import { INSERT_PAGE_BREAK_COMMAND } from "./page-break";
import { $createYouTubeNode } from "./youtube-node";
import { YouTubeForm } from "./youtube-form";
import { $createAudioNode } from "./audio-node";
import { AudioForm } from "./audio-form";
import { $createVideoNode } from "./video-node";
import { VideoForm } from "./video-form";
import { $createImageNode } from "./image-node";
import { ImageForm } from "./image-form";
import { $createIframeNode } from "./iframe-node";
import { IframeForm } from "./iframe-form";
import { $createImageComparisonNode } from "./image-comparison-node";
import { ImageComparisonForm } from "./image-comparison-form";
import { $createColumnNode, $createColumnsNode } from "./columns-node";
import { ColumnsForm } from "./columns-form";
import { TableSizePicker } from "./table-size-picker";

/**
 * Where a block can be invoked from. Each surface has its own UX
 * affordances:
 * - `"insert"` — top-toolbar Insert dropdown (supports multi-step forms)
 * - `"slash"` — `/` typeahead (quick action only, no forms)
 * - `"draggable"` — Notion-style block hover `+` (block conversion / quick insert)
 */
export type BlockSurface = "insert" | "slash" | "draggable";

export type BlockCategory =
  | "text"
  | "list"
  | "block"
  | "separator"
  | "media"
  | "embed"
  | "layout";

export interface BlockFormHandlers {
  /** Form should call when insertion is complete (host closes the popover). */
  onComplete: () => void;
  /** Form should call when the user cancels (host returns to main view). */
  onCancel: () => void;
}

/**
 * Single source of truth for an insertable / convertible block. All
 * surfaces (Insert menu, slash, draggable +) read from this registry —
 * adding a new block means adding one entry here.
 */
export interface BlockSpec {
  /** Unique stable key. */
  key: string;
  /** Display label. */
  label: string;
  /** Short description for surfaces that show one (slash). */
  description?: string;
  /** Icon node, sized for menu items (~16px). */
  icon: React.ReactElement;
  /** Search keywords (slash filter). */
  keywords?: string[];
  /** Category — used for grouping / filtering. */
  category: BlockCategory;
  /** Which UI surfaces this block appears in. */
  surfaces: BlockSurface[];
  /**
   * Quick action — runs directly on selection. Required for slash and
   * draggable surfaces. Optional when the block needs configuration
   * via `renderForm` only (e.g. embed forms).
   */
  action?: (editor: LexicalEditor) => void;
  /**
   * Optional form. When provided, surfaces that support multi-step UI
   * (currently `"insert"`) show this form as a sub-view. The form is
   * responsible for calling `handlers.onComplete()` after successful
   * insertion or `handlers.onCancel()` when dismissed.
   */
  renderForm?: (
    editor: LexicalEditor,
    handlers: BlockFormHandlers,
  ) => React.ReactNode;
}

function convertBlock(
  editor: LexicalEditor,
  factory: () => ElementNode,
): void {
  editor.update(() => {
    const sel = $getSelection();
    if ($isRangeSelection(sel)) $setBlocksType(sel, factory);
  });
}

const ICON_SIZE = "size-4";
const icon = (Component: React.ComponentType<{ className?: string }>) => (
  <Component className={ICON_SIZE} />
);

/**
 * Default block registry. Pass a custom `blocks` prop to any surface to
 * override / extend / re-order. Use `getBlocksForSurface()` to filter
 * defaults by surface, then concatenate your own.
 */
export const defaultBlocks: BlockSpec[] = [
  // ── text ───────────────────────────────────────
  {
    key: "paragraph",
    label: "Paragraph",
    description: "Plain text",
    icon: icon(PilcrowIcon),
    keywords: ["text", "p", "paragraph"],
    category: "text",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createParagraphNode()),
  },
  {
    key: "heading-1",
    label: "Heading 1",
    description: "Large section heading",
    icon: icon(Heading1Icon),
    keywords: ["h1", "title", "heading"],
    category: "text",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h1")),
  },
  {
    key: "heading-2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: icon(Heading2Icon),
    keywords: ["h2", "subtitle", "heading"],
    category: "text",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h2")),
  },
  {
    key: "heading-3",
    label: "Heading 3",
    description: "Small section heading",
    icon: icon(Heading3Icon),
    keywords: ["h3", "heading"],
    category: "text",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h3")),
  },
  {
    key: "heading-4",
    label: "Heading 4",
    description: "Sub-subsection heading",
    icon: icon(Heading4Icon),
    keywords: ["h4", "heading"],
    category: "text",
    surfaces: ["slash"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h4")),
  },
  {
    key: "heading-5",
    label: "Heading 5",
    description: "Deep heading",
    icon: icon(Heading5Icon),
    keywords: ["h5", "heading"],
    category: "text",
    surfaces: ["slash"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h5")),
  },
  {
    key: "heading-6",
    label: "Heading 6",
    description: "Deepest heading",
    icon: icon(Heading6Icon),
    keywords: ["h6", "heading"],
    category: "text",
    surfaces: ["slash"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h6")),
  },

  // ── list ───────────────────────────────────────
  {
    key: "bullet-list",
    label: "Bullet list",
    description: "Unordered items",
    icon: icon(ListBulletIcon),
    keywords: ["ul", "unordered", "list", "bullet"],
    category: "list",
    surfaces: ["slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    key: "numbered-list",
    label: "Numbered list",
    description: "Ordered items",
    icon: icon(ListOrderedIcon),
    keywords: ["ol", "ordered", "list", "number"],
    category: "list",
    surfaces: ["slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    key: "check-list",
    label: "Check list",
    description: "Tasks with checkboxes",
    icon: icon(ListCheckIcon),
    keywords: ["check", "todo", "task", "checkbox"],
    category: "list",
    surfaces: ["slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  },

  // ── block ──────────────────────────────────────
  {
    key: "quote",
    label: "Quote",
    description: "Highlighted block of text",
    icon: icon(QuoteIcon),
    keywords: ["quote", "blockquote", "citation"],
    category: "block",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createQuoteNode()),
  },
  {
    key: "code-block",
    label: "Code block",
    description: "Syntax-highlighted code",
    icon: icon(CodeIcon),
    keywords: ["code", "snippet", "pre"],
    category: "block",
    surfaces: ["slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createCodeNode()),
  },

  // ── inline utility (text-level) ────────────────
  {
    key: "date-time",
    label: "Date / time",
    description: "Insert current date or time",
    icon: icon(CalendarClockIcon),
    keywords: ["date", "time", "datetime", "today", "now", "timestamp"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    // Quick path: drop the default datetime string at the caret. Used by
    // slash and draggable surfaces (renderForm overrides this for Insert).
    action: (editor) =>
      editor.update(() => {
        const sel = $getSelection();
        if ($isRangeSelection(sel)) sel.insertText(formatDateTime());
      }),
    renderForm: (editor, { onComplete, onCancel }) => (
      <DateTimeForm
        onSubmit={(text) => {
          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) sel.insertText(text);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },

  // ── separator ──────────────────────────────────
  {
    key: "horizontal-rule",
    label: "Divider",
    description: "Horizontal separator",
    icon: icon(HorizontalRuleIcon),
    keywords: ["hr", "rule", "divider", "separator"],
    category: "separator",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    key: "page-break",
    label: "Page break",
    description: "Print / PDF page break",
    icon: icon(PageBreakIcon),
    keywords: ["pagebreak", "print", "pdf"],
    category: "separator",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_PAGE_BREAK_COMMAND, undefined),
  },

  // ── table (action default = 3×3, form = grid picker) ──
  {
    key: "table",
    label: "Table",
    description: "Rows and columns",
    icon: icon(TableIcon),
    keywords: ["table", "grid", "cells"],
    category: "block",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_TABLE_COMMAND, {
        rows: "3",
        columns: "3",
        includeHeaders: { rows: false, columns: true },
      }),
    renderForm: (editor, { onComplete, onCancel }) => (
      <TableSizePicker
        onSelect={(rows, cols) => {
          editor.dispatchCommand(INSERT_TABLE_COMMAND, {
            rows: String(rows),
            columns: String(cols),
            includeHeaders: { rows: false, columns: true },
          });
          onComplete();
        }}
        onBack={onCancel}
      />
    ),
  },

  // ── media (form-only — need URL) ───────────────
  {
    key: "youtube",
    label: "YouTube",
    description: "Embed YouTube video",
    icon: icon(YouTubeIcon),
    keywords: ["youtube", "video"],
    category: "media",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <YouTubeForm
        mode="insert"
        onSubmit={({ videoID, options }) => {
          editor.update(() => {
            $insertNodes([$createYouTubeNode(videoID, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
  {
    key: "audio",
    label: "Audio",
    description: "Embed audio file",
    icon: icon(AudioLinesIcon),
    keywords: ["audio", "mp3", "podcast", "sound"],
    category: "media",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <AudioForm
        mode="insert"
        onSubmit={({ src, options }) => {
          editor.update(() => {
            $insertNodes([$createAudioNode(src, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
  {
    key: "video",
    label: "Video",
    description: "Embed video file",
    icon: icon(VideoIcon),
    keywords: ["video", "mp4", "clip"],
    category: "media",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <VideoForm
        mode="insert"
        onSubmit={({ src, options }) => {
          editor.update(() => {
            $insertNodes([$createVideoNode(src, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
  {
    key: "image",
    label: "Image",
    description: "Embed image (jpg, png, webp, gif, ...)",
    icon: icon(ImageIcon),
    keywords: ["image", "photo", "picture", "gif"],
    category: "media",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <ImageForm
        mode="insert"
        onSubmit={({ src, options }) => {
          editor.update(() => {
            $insertNodes([$createImageNode(src, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },

  // ── embed ──────────────────────────────────────
  {
    key: "iframe",
    label: "Iframe",
    description: "Generic embed (Figma, CodePen, ...)",
    icon: icon(FrameIcon),
    keywords: ["iframe", "embed", "figma", "codepen"],
    category: "embed",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <IframeForm
        mode="insert"
        onSubmit={({ src, options }) => {
          editor.update(() => {
            $insertNodes([$createIframeNode(src, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },

  // ── layout ─────────────────────────────────────
  {
    key: "image-comparison",
    label: "Image comparison",
    description: "Before / after slider",
    icon: icon(SplitViewIcon),
    keywords: ["comparison", "before", "after", "slider"],
    category: "layout",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <ImageComparisonForm
        mode="insert"
        onSubmit={({ beforeSrc, afterSrc, options }) => {
          editor.update(() => {
            $insertNodes([
              $createImageComparisonNode(beforeSrc, afterSrc, options),
            ]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
  {
    key: "columns",
    label: "Columns layout",
    description: "Multi-column responsive grid",
    icon: icon(Columns3Icon),
    keywords: ["columns", "grid", "layout"],
    category: "layout",
    surfaces: ["insert", "slash"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <ColumnsForm
        onSubmit={(data) => {
          editor.update(() => {
            const columns = $createColumnsNode({
              count: data.count,
              gap: data.gap,
              mobileStack: data.mobileStack,
            });
            for (let i = 0; i < data.count; i++) {
              const col = $createColumnNode();
              col.append($createParagraphNode());
              columns.append(col);
            }
            $insertNodes([columns]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
];

/** Filter the default registry to a specific surface. Includes only
 *  blocks that can actually be invoked on that surface — `insert` and
 *  `slash` accept both `action` and `renderForm`; `draggable` requires
 *  an `action` (selection-based conversion semantics). */
export function getBlocksForSurface(
  surface: BlockSurface,
  blocks: BlockSpec[] = defaultBlocks,
): BlockSpec[] {
  return blocks.filter((b) => {
    if (!b.surfaces.includes(surface)) return false;
    if (surface === "draggable") return typeof b.action === "function";
    return (
      typeof b.action === "function" || typeof b.renderForm === "function"
    );
  });
}
