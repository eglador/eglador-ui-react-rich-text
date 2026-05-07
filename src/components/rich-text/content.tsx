"use client";

import * as React from "react";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { PlainTextPlugin } from "@lexical/react/LexicalPlainTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { cn } from "../../lib/utils";
import { RichTextDraggableBlock } from "./draggable-plugin";
import { RichTextFloatingToolbar } from "./floating-toolbar";
import { RichTextTableActions } from "./table-actions";
import { RichTextLinkEditor } from "./link-editor";
import { RichTextColumnsToolbar } from "./columns-toolbar";
import { usePageSize } from "./page-size-context";
import type { BlockSpec } from "./blocks-registry";

export interface RichTextContentProps {
  placeholder?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  placeholderClassName?: string;
  /** Minimum editor height (Tailwind class). Default `min-h-32` */
  minHeight?: string;
  /** Enable Notion-style drag handle + "+" insert menu (default `false`) */
  draggable?: boolean;
  /**
   * Custom blocks shown inside the draggable "+" popover. Defaults to
   * `defaultBlocks` filtered to `surfaces.includes("draggable")`.
   */
  draggableBlocks?: BlockSpec[];
  /** Enable floating format toolbar that appears on text selection (default `false`) */
  floatingToolbar?: boolean;
  /** Editor mode (default `"rich"`). `"plain"` swaps RichTextPlugin for
   *  PlainTextPlugin — text only, no inline/block formatting commands. */
  mode?: "rich" | "plain";
}

export function RichTextContent({
  placeholder = "Start writing...",
  className,
  contentClassName,
  placeholderClassName,
  minHeight = "min-h-32",
  draggable = false,
  draggableBlocks,
  floatingToolbar = false,
  mode = "rich",
}: RichTextContentProps) {
  const [anchorElem, setAnchorElem] = React.useState<HTMLDivElement | null>(
    null,
  );
  const { size } = usePageSize();

  const onAnchorRef = React.useCallback((el: HTMLDivElement | null) => {
    if (el !== null) setAnchorElem(el);
  }, []);

  return (
    <div
      className={cn(
        "relative mx-auto transition-[max-width] duration-200",
        className,
      )}
      style={
        size.width !== null ? { maxWidth: size.width } : undefined
      }
    >
      {(() => {
        const Plugin = mode === "plain" ? PlainTextPlugin : RichTextPlugin;
        return (
          <Plugin
            contentEditable={
              <div ref={onAnchorRef} className="relative">
                <ContentEditable
                  className={cn(
                    "outline-none px-4 py-3 prose prose-zinc max-w-none",
                    draggable && "pl-14",
                    minHeight,
                    contentClassName,
                  )}
                  aria-label="Rich text editor"
                />
              </div>
            }
            placeholder={
              <div
                className={cn(
                  "absolute top-3 pointer-events-none select-none text-zinc-400",
                  draggable ? "left-14" : "left-4",
                  placeholderClassName,
                )}
              >
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        );
      })()}
      {anchorElem !== null && draggable && (
        <RichTextDraggableBlock
          anchorElem={anchorElem}
          blocks={draggableBlocks}
        />
      )}
      {anchorElem !== null && floatingToolbar && (
        <RichTextFloatingToolbar anchorElem={anchorElem} />
      )}
      {anchorElem !== null && (
        <RichTextTableActions anchorElem={anchorElem} />
      )}
      {anchorElem !== null && (
        <RichTextLinkEditor anchorElem={anchorElem} />
      )}
      {anchorElem !== null && (
        <RichTextColumnsToolbar anchorElem={anchorElem} />
      )}
    </div>
  );
}

RichTextContent.displayName = "RichTextContent";
