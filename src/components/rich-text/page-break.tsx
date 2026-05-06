"use client";

import * as React from "react";
import {
  DecoratorNode,
  $getSelection,
  $isRangeSelection,
  $insertNodes,
  createCommand,
  COMMAND_PRIORITY_EDITOR,
  type LexicalCommand,
  type LexicalNode,
  type SerializedLexicalNode,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export type SerializedPageBreakNode = SerializedLexicalNode;

/**
 * Custom Lexical DecoratorNode for page breaks.
 *
 * No first-party Lexical package ships a page-break node, so this follows
 * the playground reference: a `break-after-page` block in the live document
 * (so print/PDF export honors it) plus a labeled visual marker in the
 * editor surface.
 */
export class PageBreakNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return "page-break";
  }

  static clone(node: PageBreakNode): PageBreakNode {
    return new PageBreakNode(node.__key);
  }

  static importJSON(): PageBreakNode {
    return $createPageBreakNode();
  }

  exportJSON(): SerializedPageBreakNode {
    return {
      type: "page-break",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.style.pageBreakAfter = "always";
    div.style.breakAfter = "page";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  getTextContent(): string {
    return "\n";
  }

  isInline(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return <PageBreakElement />;
  }
}

function PageBreakElement() {
  return (
    <div
      contentEditable={false}
      className="my-4 relative h-px bg-zinc-300 select-none"
      aria-label="Page break"
    >
      <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-2 bg-white text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-200 rounded">
        Page break
      </span>
    </div>
  );
}

export function $createPageBreakNode(): PageBreakNode {
  return new PageBreakNode();
}

export function $isPageBreakNode(
  node: LexicalNode | null | undefined,
): node is PageBreakNode {
  return node instanceof PageBreakNode;
}

export const INSERT_PAGE_BREAK_COMMAND: LexicalCommand<undefined> =
  createCommand("INSERT_PAGE_BREAK_COMMAND");

/**
 * Plugin that registers the `INSERT_PAGE_BREAK_COMMAND` handler.
 * Render once inside `<LexicalComposer>` to enable page-break insertion.
 */
export function PageBreakPlugin(): null {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (!editor.hasNodes([PageBreakNode])) {
      throw new Error(
        "PageBreakPlugin: PageBreakNode is not registered on the editor",
      );
    }
    return editor.registerCommand(
      INSERT_PAGE_BREAK_COMMAND,
      () => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;
        $insertNodes([$createPageBreakNode()]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
