import { $isCodeNode } from "@lexical/code";
import {
  $createRangeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type TextNode,
} from "lexical";
import type { SpellSegment } from "./analyze";
import type { SpellIssue } from "./types";

interface Part {
  key: string;
  start: number;
  end: number;
}

/**
 * Prose blocks of the live document, each with a `locate` that maps an
 * offset back to `(text node key, offset)`. Must run inside a read.
 *
 * Adjacent text nodes (`kita` + **`plar`**) are joined, so a word split
 * by formatting is still checked as one word. Code — blocks and inline
 * `code` — and hashtags are blanked out, keeping offsets intact.
 */
export function $collectSpellSegments(): SpellSegment[] {
  const segments: SpellSegment[] = [];

  const walkBlock = (block: ElementNode) => {
    if ($isCodeNode(block)) return;
    let text = "";
    let parts: Part[] = [];

    const flush = () => {
      if (text.trim()) {
        const own = parts;
        segments.push({
          text,
          blockIndex: segments.length,
          locate: (offset, edge) => {
            const part =
              edge === "start"
                ? own.find((p) => offset >= p.start && offset < p.end)
                : own.find((p) => offset > p.start && offset <= p.end);
            return part ? { key: part.key, offset: offset - part.start } : null;
          },
        });
      }
      text = "";
      parts = [];
    };

    const walkInline = (nodes: LexicalNode[]) => {
      for (const node of nodes) {
        if ($isTextNode(node)) {
          const content = node.getTextContent();
          const skip = node.hasFormat("code") || node.getType() === "hashtag";
          parts.push({
            key: node.getKey(),
            start: text.length,
            end: text.length + content.length,
          });
          text += skip ? " ".repeat(content.length) : content;
        } else if ($isLineBreakNode(node)) {
          text += "\n";
        } else if ($isElementNode(node) && node.isInline()) {
          walkInline(node.getChildren());
        } else if ($isElementNode(node)) {
          flush();
          walkBlock(node);
        } else if ($isDecoratorNode(node)) {
          // An inline chip separates words; a block ends the run.
          if (node.isInline()) text += " ";
          else flush();
        }
      }
    };

    walkInline(block.getChildren());
    flush();
  };

  walkBlock($getRoot());
  return segments;
}

/** The text nodes an issue spans, if they still read the flagged word. */
function $issueNodes(issue: SpellIssue): [TextNode, TextNode] | null {
  if (!issue.anchor || !issue.focus) return null;
  const a = $getNodeByKey(issue.anchor.key);
  const f = $getNodeByKey(issue.focus.key);
  if (!$isTextNode(a) || !$isTextNode(f)) return null;

  const { anchor, focus, word } = issue;
  if (a === f) {
    return a.getTextContent().slice(anchor.offset, focus.offset) === word
      ? [a, f]
      : null;
  }
  const head = a.getTextContent().slice(anchor.offset);
  const tail = f.getTextContent().slice(0, focus.offset);
  return word.startsWith(head) && word.endsWith(tail) ? [a, f] : null;
}

const firstTextNode = (el: HTMLElement | null): Text | null => {
  if (!el) return null;
  if (el.nodeType === Node.TEXT_NODE) return el as unknown as Text;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
};

/**
 * A DOM `Range` over an issue — for highlights, hit-testing and anchoring
 * the suggestion popover. `null` once the word has been edited away.
 */
export function getIssueRange(
  editor: LexicalEditor,
  issue: SpellIssue,
): Range | null {
  const valid = editor.getEditorState().read(() => $issueNodes(issue) !== null);
  if (!valid || !issue.anchor || !issue.focus) return null;

  const start = firstTextNode(editor.getElementByKey(issue.anchor.key));
  const end = firstTextNode(editor.getElementByKey(issue.focus.key));
  if (!start || !end) return null;
  if (issue.anchor.offset > start.length || issue.focus.offset > end.length) {
    return null;
  }
  const range = document.createRange();
  range.setStart(start, issue.anchor.offset);
  range.setEnd(end, issue.focus.offset);
  return range;
}

/** Select an issue's word (inside `editor.update`). */
export function $selectIssue(issue: SpellIssue): boolean {
  const nodes = $issueNodes(issue);
  if (!nodes) return false;
  const selection = $createRangeSelection();
  selection.anchor.set(issue.anchor!.key, issue.anchor!.offset, "text");
  selection.focus.set(issue.focus!.key, issue.focus!.offset, "text");
  $setSelection(selection);
  return true;
}

/**
 * Replace an issue's word (inside `editor.update`). Keeps the formatting
 * of the word's first character. Returns `false` if the word changed.
 */
export function $replaceIssue(issue: SpellIssue, replacement: string): boolean {
  if (!$selectIssue(issue)) return false;
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;
  selection.insertText(replacement);
  return true;
}
