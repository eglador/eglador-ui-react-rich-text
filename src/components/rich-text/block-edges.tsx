"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import {
  $createParagraphNode,
  $isDecoratorNode,
  $isElementNode,
  RootNode,
  type LexicalNode,
} from "lexical";

/**
 * Can the caret be placed *next to* this block by ordinary typing?
 *
 * A media embed or a CMS block is a decorator — it holds no text at all.
 * A table, a columns row or a news-moment body does hold text, but only
 * inside nested shadow roots, so pressing Enter in there never produces
 * a sibling outside the container. Both kinds trap the caret when they
 * sit at the very start or end of the document.
 */
function isCaretTrap(node: LexicalNode): boolean {
  if ($isDecoratorNode(node)) return !node.isInline();
  if (!$isElementNode(node) || node.isInline()) return false;
  if (node.isShadowRoot()) return true;

  // Containers whose shadow roots are one or two levels down:
  // columns → column, table → row → cell.
  return node
    .getChildren()
    .some(
      (child) =>
        $isElementNode(child) &&
        (child.isShadowRoot() ||
          child
            .getChildren()
            .some(
              (grandChild) =>
                $isElementNode(grandChild) && grandChild.isShadowRoot(),
            )),
    );
}

/**
 * The editor-level registration, without React — `RichTextBlockEdges`
 * is a thin wrapper around it, and tests drive it headlessly.
 *
 * Returns the unregister function.
 */
export function registerBlockEdges(
  editor: LexicalEditor,
  { leading = true, trailing = true }: RichTextBlockEdgesProps = {},
): () => void {
  // A node transform, so the paragraph lands in the same update as the
  // insertion — no extra history entry to undo past.
  return editor.registerNodeTransform(RootNode, (root) => {
    const first = root.getFirstChild();
    if (leading && first !== null && isCaretTrap(first)) {
      first.insertBefore($createParagraphNode());
    }
    const last = root.getLastChild();
    if (trailing && last !== null && isCaretTrap(last)) {
      last.insertAfter($createParagraphNode());
    }
  });
}

export interface RichTextBlockEdgesProps {
  /** Keep a paragraph above a leading block. Default `true`. */
  leading?: boolean;
  /** Keep a paragraph below a trailing block. Default `true`. */
  trailing?: boolean;
}

/**
 * Keeps an empty paragraph at either end of the document when the block
 * there can't be typed around — otherwise an image or CMS block that
 * opens or closes the document leaves nowhere to put the caret, and the
 * author can only get past it with the "+" menu.
 *
 * Mounted by `RichTextEditor`; switch it off with `blockEdges={false}`.
 */
export function RichTextBlockEdges({
  leading = true,
  trailing = true,
}: RichTextBlockEdgesProps = {}) {
  const [editor] = useLexicalComposerContext();

  React.useEffect(
    () => registerBlockEdges(editor, { leading, trailing }),
    [editor, leading, trailing],
  );

  return null;
}

RichTextBlockEdges.displayName = "RichTextBlockEdges";
