"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isHeadingNode, type HeadingTagType } from "@lexical/rich-text";
import {
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

/**
 * How many characters a heading should stay under. One number covers
 * every heading level; an object sets them per level, and a level left
 * out of the object is not counted at all.
 */
export type HeadingLimitConfig =
  | number
  | Partial<Record<HeadingTagType, number>>;

export const DEFAULT_HEADING_LIMIT = 70;

export interface HeadingLimitOptions {
  /** Characters allowed before the counter turns red. Default `70`. */
  limit?: HeadingLimitConfig;
  /**
   * Show the counter on every heading, not just the one being edited
   * and the ones already over. Default `false`.
   */
  always?: boolean;
}

const COUNT_ATTRIBUTE = "data-eglador-heading-count";
const OVER_ATTRIBUTE = "data-eglador-heading-over";
const STYLE_ID = "eglador-heading-limit-style";

const limitFor = (
  tag: HeadingTagType,
  limit: HeadingLimitConfig,
): number | null => {
  if (typeof limit === "number") return limit > 0 ? limit : null;
  const value = limit[tag];
  return typeof value === "number" && value > 0 ? value : null;
};

/**
 * The counter is a CSS `::after` on the heading element, fed by a data
 * attribute. It never becomes a node, so it stays out of the JSON, the
 * HTML export and the text content — and it can't be selected, copied
 * or deleted by the author.
 *
 * Lexical's MutationObserver watches `childList` and `characterData`
 * only, so writing an attribute here does not get reverted.
 */
function ensureStyle(doc: Document) {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
[${COUNT_ATTRIBUTE}]::after {
  content: attr(${COUNT_ATTRIBUTE});
  display: inline-block;
  margin-inline-start: 0.5em;
  padding: 0.1em 0.5em;
  border-radius: 9999px;
  border: 1px solid rgb(228 228 231);
  background: rgb(250 250 250);
  color: rgb(113 113 122);
  font-size: 0.6em;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  vertical-align: middle;
  user-select: none;
  -webkit-user-select: none;
  pointer-events: none;
}
[${OVER_ATTRIBUTE}]::after {
  border-color: rgb(252 165 165);
  background: rgb(254 242 242);
  color: rgb(185 28 28);
}`;
  doc.head.appendChild(style);
}

/** Every heading in the document, including ones nested in notes,
 *  columns and table cells. */
function $collectHeadings(): LexicalNode[] {
  const found: LexicalNode[] = [];
  const walk = (node: LexicalNode) => {
    if ($isHeadingNode(node)) {
      found.push(node);
      return;
    }
    if ($isElementNode(node)) node.getChildren().forEach(walk);
  };
  $getRoot().getChildren().forEach(walk);
  return found;
}

/**
 * The editor-level registration, without React. Returns the unregister
 * function.
 */
export function registerHeadingLimit(
  editor: LexicalEditor,
  { limit = DEFAULT_HEADING_LIMIT, always = false }: HeadingLimitOptions = {},
): () => void {
  const marked = new Set<HTMLElement>();

  const clear = (element: HTMLElement) => {
    element.removeAttribute(COUNT_ATTRIBUTE);
    element.removeAttribute(OVER_ATTRIBUTE);
  };

  const paint = () => {
    const root = editor.getRootElement();
    if (!root) return;
    ensureStyle(root.ownerDocument);

    const next = new Set<HTMLElement>();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const activeKeys = $isRangeSelection(selection)
        ? selection
            .getNodes()
            .map((node) => node.getTopLevelElement()?.getKey())
        : [];

      for (const heading of $collectHeadings()) {
        if (!$isHeadingNode(heading)) continue;
        const max = limitFor(heading.getTag(), limit);
        if (max === null) continue;

        const element = editor.getElementByKey(heading.getKey());
        if (!element) continue;

        const length = heading.getTextContent().length;
        const over = length > max;
        // Quiet until it matters: the heading being edited, or one that
        // is already too long wherever it sits.
        if (!always && !over && !activeKeys.includes(heading.getKey())) {
          continue;
        }

        element.setAttribute(COUNT_ATTRIBUTE, `${length}/${max}`);
        if (over) element.setAttribute(OVER_ATTRIBUTE, "");
        else element.removeAttribute(OVER_ATTRIBUTE);
        next.add(element);
      }
    });

    for (const element of marked) {
      if (!next.has(element)) clear(element);
    }
    marked.clear();
    for (const element of next) marked.add(element);
  };

  paint();
  const unregister = editor.registerUpdateListener(paint);
  return () => {
    unregister();
    for (const element of marked) clear(element);
    marked.clear();
  };
}

export interface RichTextHeadingLimitProps extends HeadingLimitOptions {}

/**
 * Shows a character counter on headings — `62/70` next to the one
 * being edited, turning red once it is over. The limit is advisory: the
 * author can keep typing, and nothing is truncated.
 *
 * The counter is drawn with CSS from a data attribute, so it never
 * reaches the document: `onChange`, `getJson()`, the HTML export and
 * `getText()` are all unaffected.
 *
 * Mounted by `RichTextEditor`; configure with `headingLimit`.
 */
export function RichTextHeadingLimit({
  limit,
  always,
}: RichTextHeadingLimitProps = {}): null {
  const [editor] = useLexicalComposerContext();
  // An inline object prop would re-register on every render.
  const key = JSON.stringify(limit ?? null);
  React.useEffect(
    () => registerHeadingLimit(editor, { limit, always }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, key, always],
  );
  return null;
}

RichTextHeadingLimit.displayName = "RichTextHeadingLimit";
