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
  $getRoot,
  $getSelection,
  $setSelection,
  $insertNodes,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { $createOffsetView } from "@lexical/offset";
import {
  $createLegacyComponentNodeFromInput,
  $isLegacyComponentNode,
} from "./legacy-component-node";
import type { LegacyComponentInput } from "./legacy-shortcode";

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
   *  legacy-shortcode.ts for the full union and field shapes. */
  importLegacyComponents: (items: LegacyComponentInput[]) => void;
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
            if ($isLegacyComponentNode(node)) result.push(node.getShortcode());
          }
        });
        return result;
      },

      setJson: (json: string) => {
        const state = editor.parseEditorState(json);
        editor.setEditorState(state);
      },

      setHtml: (html: string) => {
        editor.update(() => {
          const dom = new DOMParser().parseFromString(html, "text/html");
          const nodes = $generateNodesFromDOM(editor, dom);
          const root = $getRoot();
          root.clear();
          root.select();
          $insertNodes(nodes);
        });
      },

      setMarkdown: (markdown: string) => {
        editor.update(() => {
          $convertFromMarkdownString(markdown, TRANSFORMERS);
        });
      },

      importLegacyComponents: (items: LegacyComponentInput[]) => {
        if (items.length === 0) return;
        editor.update(() => {
          const root = $getRoot();
          for (const item of items) {
            root.append($createLegacyComponentNodeFromInput(item));
          }
          // Same reasoning as the Insert/slash form path — a trailing
          // block-level decorator node leaves no valid place for the
          // caret, which makes the editor look "stuck" right after import.
          const paragraph = $createParagraphNode();
          root.append(paragraph);
          paragraph.selectEnd();
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
