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
  $getRoot,
  $getSelection,
  $setSelection,
  $isElementNode,
  $isRangeSelection,
  $createParagraphNode,
  type LexicalEditor,
} from "lexical";
import { $createOffsetView } from "@lexical/offset";

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
  /** Replace state from Lexical JSON */
  setJson: (json: string) => void;
  /** Replace state from HTML */
  setHtml: (html: string) => void;
  /** Replace state from Markdown */
  setMarkdown: (markdown: string) => void;
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
          nodes.forEach((node) => {
            if ($isElementNode(node)) {
              root.append(node);
            } else {
              root.append($createParagraphNode().append(node));
            }
          });
        });
      },

      setMarkdown: (markdown: string) => {
        editor.update(() => {
          $convertFromMarkdownString(markdown, TRANSFORMERS);
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
