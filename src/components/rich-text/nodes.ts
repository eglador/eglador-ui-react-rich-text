import type { Klass, LexicalNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { HashtagNode } from "@lexical/hashtag";
import { OverflowNode } from "@lexical/overflow";
import { PageBreakNode } from "./page-break";
import { YouTubeNode } from "./youtube-node";
import { AudioNode } from "./audio-node";
import { VideoNode } from "./video-node";
import { ImageNode } from "./image-node";
import { IframeNode } from "./iframe-node";
import { ImageComparisonNode } from "./image-comparison-node";
import { ColumnsNode, ColumnNode } from "./columns-node";
import { LegacyComponentNode } from "./legacy-component-node";
import { NewsMomentNode } from "./news-moment-node";
import { cmsNodes } from "./cms";

/**
 * Default Lexical nodes registered with the composer.
 * Covers heading, quote, list, link, code, horizontal rule, page break,
 * table, hashtag and overflow (used by the optional character-limit plugin),
 * plus one node per Eglador CMS block type (see `cms/cms-schema.tsx`).
 */
export const defaultNodes: Klass<LexicalNode>[] = [
  HeadingNode,
  QuoteNode,
  ListItemNode,
  ListNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  HorizontalRuleNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  HashtagNode,
  OverflowNode,
  YouTubeNode,
  AudioNode,
  VideoNode,
  ImageNode,
  IframeNode,
  ImageComparisonNode,
  ColumnsNode,
  ColumnNode,
  PageBreakNode,
  LegacyComponentNode,
  NewsMomentNode,
  ...cmsNodes,
];

// Lexical keys its node registry by `getType()` and the map is
// last-write-wins, so two nodes claiming one type silently replace each
// other — and every existing node of the losing type stops parsing.
// This bit twice already: `text` belongs to TextNode, and the CMS
// `link` type shadowed @lexical/link's LinkNode. Fail loudly here
// rather than corrupting documents at runtime.
const seenTypes = new Set<string>();
for (const node of defaultNodes) {
  const type = node.getType();
  if (seenTypes.has(type)) {
    throw new Error(
      `[eglador-ui-react-rich-text] duplicate Lexical node type "${type}" in defaultNodes — ` +
        "pick a unique `type` for the offending CMS block (see cms/cms-schema.tsx).",
    );
  }
  seenTypes.add(type);
}
