"use client";

import * as React from "react";
import {
  $createParagraphNode,
  $createTextNode,
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
import { LegacyComponentForm } from "./legacy-component-form";
import { legacyComponentToShortcode } from "./legacy-shortcode";
import type { LegacyComponentSpec } from "./legacy-schema";
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
import {
  $createNewsMomentNode,
  NEWS_MOMENT_SPEC,
  nowMeta,
  type NewsMomentMeta,
} from "./news-moment-node";
import {
  $createContextNoteNode,
  CONTEXT_NOTE_SPEC,
  type ContextNoteMeta,
} from "./context-note-node";
import { cmsBlocks, CmsForm } from "./cms";

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

/** Generic fallback icon for legacy component blocks that don't supply
 *  their own `spec.icon`. */
const LEGACY_FALLBACK_ICON = icon(FrameIcon);

/**
 * Turns a consumer-supplied `LegacyComponentSpec[]` into `BlockSpec[]` —
 * one entry per spec, each opening a form (built from `spec.fields`) on
 * the `"insert"` / `"slash"` surfaces. This library has no built-in
 * notion of what types exist; call this with your own schema and merge
 * the result into `defaultBlocks` (or pass it standalone) via the
 * `blocks` prop on `RichTextToolbar` / `RichTextSlashCommands` /
 * `RichTextDraggableBlock`.
 *
 * @example
 * const blocks = [...defaultBlocks, ...createLegacyComponentBlocks(mySchema)];
 * <RichTextToolbar insertBlocks={blocks} />
 * <RichTextSlashCommands blocks={blocks} />
 */
export function createLegacyComponentBlocks(
  schema: LegacyComponentSpec[],
): BlockSpec[] {
  return schema.map((spec) => legacyComponentBlock(spec));
}

function legacyComponentBlock(spec: LegacyComponentSpec): BlockSpec {
  return {
    key: `legacy-${spec.type}`,
    label: spec.title,
    description: spec.description ?? `#${spec.type}#...#`,
    icon: spec.icon ?? LEGACY_FALLBACK_ICON,
    keywords: [spec.type, "legacy", "shortcode"],
    category: "embed",
    surfaces: ["insert", "slash", "draggable"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <LegacyComponentForm
        spec={spec}
        onSubmit={(input) => {
          editor.update(() => {
            // Inserted as plain editable text (not a decorator node) so
            // the user can revise the shortcode by hand afterwards —
            // the structured form is only used to produce the initial
            // string.
            const paragraph = $createParagraphNode();
            paragraph.append(
              $createTextNode(legacyComponentToShortcode(input, spec.template)),
            );
            $insertNodes([paragraph]);
            paragraph.selectEnd();
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  };
}

/**
 * Default block registry. Pass a custom `blocks` prop to any surface to
 * override / extend / re-order. Use `getBlocksForSurface()` to filter
 * defaults by surface, then concatenate your own.
 */
export const defaultBlocks: BlockSpec[] = [
  // ── text ───────────────────────────────────────
  {
    key: "paragraph",
    label: "Paragraf",
    description: "Düz metin",
    icon: icon(PilcrowIcon),
    keywords: ["text", "p", "paragraph"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createParagraphNode()),
  },
  {
    key: "heading-1",
    label: "Başlık 1",
    description: "Büyük bölüm başlığı",
    icon: icon(Heading1Icon),
    keywords: ["h1", "title", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h1")),
  },
  {
    key: "heading-2",
    label: "Başlık 2",
    description: "Orta bölüm başlığı",
    icon: icon(Heading2Icon),
    keywords: ["h2", "subtitle", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h2")),
  },
  {
    key: "heading-3",
    label: "Başlık 3",
    description: "Küçük bölüm başlığı",
    icon: icon(Heading3Icon),
    keywords: ["h3", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h3")),
  },
  {
    key: "heading-4",
    label: "Başlık 4",
    description: "Alt bölüm başlığı",
    icon: icon(Heading4Icon),
    keywords: ["h4", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h4")),
  },
  {
    key: "heading-5",
    label: "Başlık 5",
    description: "Derin başlık",
    icon: icon(Heading5Icon),
    keywords: ["h5", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h5")),
  },
  {
    key: "heading-6",
    label: "Başlık 6",
    description: "En derin başlık",
    icon: icon(Heading6Icon),
    keywords: ["h6", "heading"],
    category: "text",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createHeadingNode("h6")),
  },

  // ── list ───────────────────────────────────────
  {
    key: "bullet-list",
    label: "Madde listesi",
    description: "Sırasız maddeler",
    icon: icon(ListBulletIcon),
    keywords: ["ul", "unordered", "list", "bullet"],
    category: "list",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
  },
  {
    key: "numbered-list",
    label: "Numaralı liste",
    description: "Sıralı maddeler",
    icon: icon(ListOrderedIcon),
    keywords: ["ol", "ordered", "list", "number"],
    category: "list",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
  },
  {
    key: "check-list",
    label: "Yapılacaklar listesi",
    description: "Onay kutulu görevler",
    icon: icon(ListCheckIcon),
    keywords: ["check", "todo", "task", "checkbox"],
    category: "list",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
  },

  // ── block ──────────────────────────────────────
  {
    key: "quote",
    label: "Alıntı",
    description: "Vurgulanmış metin bloğu",
    icon: icon(QuoteIcon),
    keywords: ["quote", "blockquote", "citation"],
    category: "block",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createQuoteNode()),
  },
  {
    key: "code-block",
    label: "Kod bloğu",
    description: "Sözdizimi renklendirmeli kod",
    icon: icon(CodeIcon),
    keywords: ["code", "snippet", "pre"],
    category: "block",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) => convertBlock(editor, () => $createCodeNode()),
  },

  // ── inline utility (text-level) ────────────────
  {
    key: "date-time",
    label: "Tarih / saat",
    description: "Güncel tarih veya saati ekle",
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
    label: "Ayırıcı",
    description: "Yatay ayraç",
    icon: icon(HorizontalRuleIcon),
    keywords: ["hr", "rule", "divider", "separator"],
    category: "separator",
    surfaces: ["insert", "slash", "draggable"],
    action: (editor) =>
      editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
  },
  {
    key: "page-break",
    label: "Sayfa sonu",
    description: "Yazdırma / PDF sayfa sonu",
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
    label: "Tablo",
    description: "Satır ve sütunlar",
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
    description: "YouTube videosu göm",
    icon: icon(YouTubeIcon),
    keywords: ["youtube", "video"],
    category: "media",
    surfaces: ["insert", "slash", "draggable"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <YouTubeForm
        mode="insert"
        onSubmit={({ url, options }) => {
          editor.update(() => {
            $insertNodes([$createYouTubeNode(url, options)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
  {
    key: "audio",
    label: "Ses",
    description: "Ses dosyası göm",
    icon: icon(AudioLinesIcon),
    keywords: ["audio", "mp3", "podcast", "sound"],
    category: "media",
    surfaces: ["insert", "slash", "draggable"],
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
    description: "Video dosyası göm",
    icon: icon(VideoIcon),
    keywords: ["video", "mp4", "clip"],
    category: "media",
    surfaces: ["insert", "slash", "draggable"],
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
    label: "Resim",
    description: "Resim göm (jpg, png, webp, gif, ...)",
    icon: icon(ImageIcon),
    keywords: ["image", "photo", "picture", "gif"],
    category: "media",
    surfaces: ["insert", "slash", "draggable"],
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
    description: "Genel gömme (Figma, CodePen, ...)",
    icon: icon(FrameIcon),
    keywords: ["iframe", "embed", "figma", "codepen"],
    category: "embed",
    surfaces: ["insert", "slash", "draggable"],
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
    label: "Görsel karşılaştırma",
    description: "Önce / sonra sürgüsü",
    icon: icon(SplitViewIcon),
    keywords: ["comparison", "before", "after", "slider"],
    category: "layout",
    surfaces: ["insert", "slash", "draggable"],
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
    label: "Sütun düzeni",
    description: "Çok sütunlu duyarlı ızgara",
    icon: icon(Columns3Icon),
    keywords: ["columns", "grid", "layout"],
    category: "layout",
    surfaces: ["insert", "slash", "draggable"],
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

  // ── Eglador CMS blocks ─────────────────────────
  // One real Lexical node per CMS type — see cms/cms-schema.tsx.
  ...cmsBlocks,

  // News moment is an ElementNode, not a decorator: the form collects
  // the metadata up front, then the body is typed inline in the
  // document. The same form reopens from the block's own header.
  {
    key: "cms-newsMoment",
    label: NEWS_MOMENT_SPEC.title,
    description: NEWS_MOMENT_SPEC.description,
    icon: NEWS_MOMENT_SPEC.icon,
    keywords: NEWS_MOMENT_SPEC.keywords,
    category: "embed",
    surfaces: ["insert", "slash", "draggable"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <CmsForm
        spec={NEWS_MOMENT_SPEC}
        mode="insert"
        // Prefilled with "now" — still editable, and a live-blog entry
        // is almost always stamped at the moment it's written.
        initialValues={{ ...nowMeta(), title: "", images: "" }}
        onSubmit={(values) => {
          editor.update(() => {
            const node = $createNewsMomentNode(values as NewsMomentMeta);
            $insertNodes([node]);
            // Drop the caret straight into the body so the author can
            // start typing the content immediately.
            node.selectStart();
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },

  // Same shape as a news moment minus the timestamp — background
  // information attached to a story rather than a dated live-blog entry.
  {
    key: "cms-contextNote",
    label: CONTEXT_NOTE_SPEC.title,
    description: CONTEXT_NOTE_SPEC.description,
    icon: CONTEXT_NOTE_SPEC.icon,
    keywords: CONTEXT_NOTE_SPEC.keywords,
    category: "embed",
    surfaces: ["insert", "slash", "draggable"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <CmsForm
        spec={CONTEXT_NOTE_SPEC}
        mode="insert"
        onSubmit={(values) => {
          editor.update(() => {
            const node = $createContextNoteNode(values as ContextNoteMeta);
            $insertNodes([node]);
            // Drop the caret straight into the body so the author can
            // start typing the content immediately.
            node.selectStart();
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  },
];

/** Filter the registry to a specific surface. All three surfaces accept
 *  both `action` and `renderForm`, so given the same `blocks` array they
 *  return identical lists in identical order — the toolbar Insert menu,
 *  the `/` menu and the drag-handle `+` menu never drift apart. */
export function getBlocksForSurface(
  surface: BlockSurface,
  blocks: BlockSpec[] = defaultBlocks,
): BlockSpec[] {
  return blocks.filter(
    (b) =>
      b.surfaces.includes(surface) &&
      (typeof b.action === "function" || typeof b.renderForm === "function"),
  );
}
