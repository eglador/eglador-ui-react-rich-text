"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  TRANSFORMERS,
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $generateHtmlFromNodes,
  $generateNodesFromDOM,
} from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $setSelection,
  $insertNodes,
  $isRangeSelection,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
} from "lexical";
import { $createOffsetView } from "@lexical/offset";
import { $isLegacyComponentNode } from "./legacy-component-node";
import {
  isLegacyShortcodeLine,
  legacyComponentToShortcode,
  type LegacyComponentInput,
} from "./legacy-shortcode";
import type { LegacyComponentSpec } from "./legacy-schema";

export type RichTextEditorApi = {
  /** Underlying Lexical editor instance — for advanced commands */
  editor: LexicalEditor;
  /** Get current state as Lexical JSON */
  getJson: () => string;
  /** Get current state as HTML */
  getHtml: () => string;
  /** Get current state as Markdown */
  getMarkdown: () => string;
  /** Get plain text content */
  getText: () => string;
  /** Get every legacy `#type#field#field#` component currently in the
   *  document, as an array of shortcode strings (one per component, in
   *  document order). Non-component content is ignored. */
  getLegacyShortcodes: () => string[];
  /** Replace state from Lexical JSON */
  setJson: (json: string) => void;
  /** Replace state from HTML */
  setHtml: (html: string) => void;
  /** Replace state from Markdown */
  setMarkdown: (markdown: string) => void;
  /** Append legacy components (image, video, embed link, etc.) to the
   *  document from typed `LegacyComponentInput` objects — see
   *  legacy-shortcode.ts for the full union and field shapes. Pass the
   *  same `schema` you hand to `createLegacyComponentBlocks()` so each
   *  item's type-specific `template` (if any) is honored — without it,
   *  every item renders in the default `#type#field#value#` layout. */
  importLegacyComponents: (
    items: LegacyComponentInput[],
    schema?: LegacyComponentSpec[],
  ) => void;
  /** Empty the editor */
  clear: () => void;
  /** Move browser focus into the editor */
  focus: () => void;
  /** Get cursor position as a character offset from document start.
   *  Returns `null` when there is no range selection. */
  getCursorOffset: () => number | null;
  /** Place the cursor at a character offset from document start. */
  setCursorOffset: (offset: number) => void;
};

/**
 * Access the LexicalEditor instance plus high-level helpers from any
 * component that lives inside `<RichTextEditor>`.
 */
export function useRichTextEditor(): RichTextEditorApi {
  const [editor] = useLexicalComposerContext();

  return React.useMemo<RichTextEditorApi>(
    () => ({
      editor,

      getJson: () => JSON.stringify(editor.getEditorState().toJSON()),

      getHtml: () => {
        let result = "";
        editor.read(() => {
          result = $generateHtmlFromNodes(editor);
        });
        return result;
      },

      getMarkdown: () => {
        let result = "";
        editor.read(() => {
          result = $convertToMarkdownString(TRANSFORMERS);
        });
        return result;
      },

      getText: () => {
        let result = "";
        editor.read(() => {
          result = $getRoot().getTextContent();
        });
        return result;
      },

      getLegacyShortcodes: () => {
        const result: string[] = [];
        editor.read(() => {
          for (const node of $getRoot().getChildren()) {
            // Decorator form — only present in documents created before
            // legacy components became plain editable text.
            if ($isLegacyComponentNode(node)) {
              result.push(node.getShortcode());
              continue;
            }
            // Plain-text form — a block whose entire text content looks
            // like a `#type#...#` shortcode line (default layout or a
            // custom `template`).
            if (isLegacyShortcodeLine(node.getTextContent())) {
              result.push(node.getTextContent().trim());
            }
          }
        });
        return result;
      },

      setJson: (json: string) => {
        const state = editor.parseEditorState(json);
        editor.setEditorState(state);
      },

      setHtml: (html: string) => {
        editor.update(
          () => {
            const dom = new DOMParser().parseFromString(html, "text/html");
            const nodes = $generateNodesFromDOM(editor, dom);
            const root = $getRoot();
            root.clear();
            root.select();
            $insertNodes(nodes);
          },
          // Replacing content programmatically shouldn't move the native
          // selection into the editor (which implicitly focuses it and
          // can scroll the page) — call `.focus()` afterwards if that's
          // wanted.
          { tag: SKIP_DOM_SELECTION_TAG },
        );
      },

      setMarkdown: (markdown: string) => {
        editor.update(() => {
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        });
      },

      importLegacyComponents: (
        items: LegacyComponentInput[],
        schema?: LegacyComponentSpec[],
      ) => {
        if (items.length === 0) return;
        editor.update(() => {
          const root = $getRoot();
          let lastParagraph: ReturnType<typeof $createParagraphNode> | null = null;
          for (const item of items) {
            const template = schema?.find((s) => s.type === item.type)?.template;
            const paragraph = $createParagraphNode();
            paragraph.append(
              $createTextNode(legacyComponentToShortcode(item, template)),
            );
            root.append(paragraph);
            lastParagraph = paragraph;
          }
          lastParagraph?.selectEnd();
        });
      },

      clear: () => {
        editor.update(() => {
          $getRoot().clear();
        });
      },

      focus: () => {
        editor.focus();
      },

      getCursorOffset: () => {
        let result: number | null = null;
        editor.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
          const view = $createOffsetView(editor);
          const [start] = view.getOffsetsFromSelection(selection);
          result = start;
        });
        return result;
      },

      setCursorOffset: (offset: number) => {
        editor.update(() => {
          const view = $createOffsetView(editor);
          const selection = view.createSelectionFromOffsets(offset, offset);
          if (selection) $setSelection(selection);
        });
      },
    }),
    [editor],
  );
}
