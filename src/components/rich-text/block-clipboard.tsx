"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getClipboardDataFromSelection,
  copyToClipboard,
} from "@lexical/clipboard";
import { mergeRegister } from "@lexical/utils";
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";

/** Chrome the author clicks to operate a block rather than to pick it. */
const INTERACTIVE = "button, a, input, select, textarea, label, video, audio";

/**
 * Select the block that was clicked.
 *
 * Lexical's own decorator wrapper only selects when the click lands on
 * the wrapper itself, so clicking the picture inside an image block left
 * an ordinary caret and the block was never really "picked up" — which
 * is what cut and copy work from.
 */
function registerSelectBlockOnClick(editor: LexicalEditor): () => void {
  return editor.registerCommand<MouseEvent>(
    CLICK_COMMAND,
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest(INTERACTIVE)) return false;

      const node = $getNearestNodeFromDOMNode(target);
      if (node === null) return false;
      const block = $isDecoratorNode(node)
        ? node
        : node.getParents().find($isDecoratorNode);
      if (!block || block.isInline()) return false;

      const selection = $createNodeSelection();
      selection.add(block.getKey());
      $setSelection(selection);
      return true;
    },
    COMMAND_PRIORITY_LOW,
  );
}

/**
 * Cut and copy for a selected block.
 *
 * Clicking an image, a video or a CMS block gives it a Lexical *node*
 * selection, which has no DOM range behind it — and with nothing
 * selected in the DOM the browser never fires `cut` or `copy`, so the
 * keystroke did nothing at all. Here the keystroke is caught and the
 * clipboard filled through `copyToClipboard`, which writes every format
 * Lexical's own paste handler understands, so the block comes back
 * whole: an ID-addressed image keeps its ID, a video its options.
 *
 * Pasting needs no help — `paste` fires on the editable regardless.
 */
export function registerBlockClipboard(editor: LexicalEditor): () => void {
  return mergeRegister(
    registerSelectBlockOnClick(editor),
    registerBlockCutCopy(editor),
  );
}

function registerBlockCutCopy(editor: LexicalEditor): () => void {
  return editor.registerCommand<KeyboardEvent>(
    KEY_DOWN_COMMAND,
    (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return false;
      }
      const key = event.key.toLowerCase();
      if (key !== "c" && key !== "x") return false;

      const selection = $getSelection();
      if (!$isNodeSelection(selection)) return false;
      const nodes = selection.getNodes();
      if (nodes.length === 0) return false;

      // Built while the selection is still live; the copy itself is async.
      const data = $getClipboardDataFromSelection(selection);
      const cut = key === "x";
      event.preventDefault();

      void copyToClipboard(editor, null, data).then((copied) => {
        if (!copied || !cut) return;
        editor.update(() => {
          $removeBlocks(nodes);
        });
      });
      return true;
    },
    COMMAND_PRIORITY_LOW,
  );
}

/** Remove cut blocks and leave the caret where they were. */
function $removeBlocks(nodes: LexicalNode[]): void {
  const first = nodes[0];
  const neighbour =
    first?.getPreviousSibling() ?? nodes[nodes.length - 1]?.getNextSibling();

  for (const node of nodes) {
    // The nodes were captured before the copy resolved — a document that
    // changed meanwhile may no longer hold them.
    if (node.isAttached()) node.remove();
  }

  if (neighbour !== null && neighbour !== undefined && neighbour.isAttached()) {
    if ($isElementNode(neighbour)) neighbour.selectEnd();
    else neighbour.selectNext();
    return;
  }
  $getRoot().selectEnd();
}

/**
 * Makes Ctrl/Cmd+X and Ctrl/Cmd+C work on a selected block (image,
 * video, CMS block). Mounted by `RichTextEditor`.
 */
export function RichTextBlockClipboard(): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => registerBlockClipboard(editor), [editor]);
  return null;
}

RichTextBlockClipboard.displayName = "RichTextBlockClipboard";
