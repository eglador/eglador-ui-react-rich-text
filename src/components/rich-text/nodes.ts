import type { Klass, LexicalNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { TableNode, TableRowNode, TableCellNode } from "@lexical/table";
import { PageBreakNode } from "./page-break";

/**
 * Default Lexical nodes registered with the composer.
 * Covers heading, quote, list, link, code, horizontal rule, page break and table.
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
  PageBreakNode,
];
