"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertDataTransferForRichText } from "@lexical/clipboard";
import { $isCodeNode } from "@lexical/code";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  PASTE_COMMAND,
  type LexicalEditor,
} from "lexical";

/** Blocks that may legitimately be empty because of what they contain. */
const KEEPS_ITS_SPACE =
  "img, picture, svg, video, audio, iframe, embed, object, table, hr, input, br[data-keep]";

/** Block-level tags that turn into their own paragraph on import. */
const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "BLOCKQUOTE",
  "SECTION",
  "ARTICLE",
  "LI",
  "PRE",
]);

const isBlank = (element: Element) =>
  // ` ` is the &nbsp; Word and Google Docs put in their spacer rows.
  element.textContent?.replace(/[\s ​]/g, "") === "" &&
  element.querySelector(KEEPS_ITS_SPACE) === null;

/**
 * Drop the blank blocks word processors use for vertical spacing.
 *
 * Word writes `<p class=MsoNormal><o:p>&nbsp;</o:p></p>` between
 * paragraphs, Google Docs writes a bare `<br>` between them, and plenty
 * of sites wrap text in `<div><br></div>`. Each one imports as an empty
 * paragraph, so pasted text arrives double-spaced. Paragraph spacing is
 * the stylesheet's job, so these carry no information worth keeping.
 */
export function cleanPastedHtml(html: string): string {
  if (!html.trim()) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  const { body } = doc;
  if (!body) return html;

  // A <br> that merely separates two blocks (rather than breaking a line
  // inside one) becomes an empty paragraph of its own.
  for (const br of [...body.querySelectorAll("br")]) {
    const previous = br.previousElementSibling;
    const next = br.nextElementSibling;
    const touchesBlock =
      (previous !== null && BLOCK_TAGS.has(previous.tagName)) ||
      (next !== null && BLOCK_TAGS.has(next.tagName));
    const parentIsBlock = br.parentElement
      ? BLOCK_TAGS.has(br.parentElement.tagName)
      : false;
    if (touchesBlock && (!parentIsBlock || br.parentElement === body)) {
      br.remove();
    }
  }

  // Deepest first, so a blank block nested in another blank block leaves
  // its parent blank too and both go.
  for (const element of [...body.querySelectorAll("*")].reverse()) {
    if (!BLOCK_TAGS.has(element.tagName)) continue;
    if (element.tagName === "PRE") continue;
    if (isBlank(element)) element.remove();
  }

  return body.innerHTML;
}

/**
 * Collapse the blank lines in pasted plain text — `a\n\n\nb` is two
 * paragraphs, not two paragraphs with two empty ones between them.
 */
export function collapsePastedText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\n[ \t ]*(?=\n)/g, "")
    .replace(/^\n+|\n+$/g, "");
}

/** Is the caret inside a code block, where blank lines are content? */
function $pastingIntoCode(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  const node = selection.anchor.getNode();
  return $isCodeNode(node) || node.getParents().some($isCodeNode);
}

/**
 * The editor-level registration, without React. Returns the unregister
 * function.
 */
export function registerPasteCleanup(editor: LexicalEditor): () => void {
  return editor.registerCommand<ClipboardEvent>(
    PASTE_COMMAND,
    (event) => {
      const clipboard = event.clipboardData;
      if (!clipboard || $pastingIntoCode()) return false;

      const html = clipboard.getData("text/html");
      const text = clipboard.getData("text/plain");
      // Lexical's own clipboard format already carries clean nodes.
      if (clipboard.getData("application/x-lexical-editor")) return false;

      const cleanedHtml = cleanPastedHtml(html);
      const cleanedText = collapsePastedText(text);
      const changed = html ? cleanedHtml !== html : cleanedText !== text;
      // Nothing to tidy — let Lexical handle the paste as usual.
      if (!changed) return false;

      const data = new DataTransfer();
      if (cleanedHtml) data.setData("text/html", cleanedHtml);
      if (cleanedText) data.setData("text/plain", cleanedText);

      event.preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        if (selection !== null) {
          $insertDataTransferForRichText(data, selection, editor);
        }
      });
      return true;
    },
    // Above @lexical/rich-text's own handler (COMMAND_PRIORITY_EDITOR),
    // so the payload is tidied before it builds nodes from it.
    COMMAND_PRIORITY_NORMAL,
  );
}

/**
 * Strips the blank spacer blocks out of pasted content, so text copied
 * from Word, Google Docs or a web page doesn't arrive double-spaced.
 *
 * Mounted by `RichTextEditor`; switch it off with `pasteCleanup={false}`.
 */
export function RichTextPasteCleanup(): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => registerPasteCleanup(editor), [editor]);
  return null;
}

RichTextPasteCleanup.displayName = "RichTextPasteCleanup";
