"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { mergeRegister } from "@lexical/utils";
import { LinkEditForm } from "./link-edit-form";

interface RichTextLinkEditorProps {
  /** Element used as positioning anchor (typically the editor's content wrapper) */
  anchorElem: HTMLElement;
}

type ActiveLink = {
  key: string;
  /** Top offset relative to anchor element */
  top: number;
  /** Left offset relative to anchor element */
  left: number;
};

/**
 * Floating link editor that auto-opens when the cursor enters a link.
 * Anchored below the link element. Uses `LinkEditForm` for the actual
 * form, keyed by link node key so the form re-reads attributes when the
 * cursor moves to a different link.
 *
 * Closes when the cursor leaves the link, or when Update / Remove is
 * clicked (Update closes immediately; user can re-enter the link to
 * reopen). No Cancel — the editor is intrinsically tied to cursor
 * position.
 */
export function RichTextLinkEditor({ anchorElem }: RichTextLinkEditorProps) {
  const [editor] = useLexicalComposerContext();
  const [activeLink, setActiveLink] = React.useState<ActiveLink | null>(null);
  /** Per-link dismissal: if user explicitly closed the editor, hide it
   *  until the cursor moves to a different link (or back to this one). */
  const [dismissedKey, setDismissedKey] = React.useState<string | null>(null);

  const updateActiveLink = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setActiveLink(null);
        return;
      }
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      const linkNode = $isLinkNode(node)
        ? node
        : $isLinkNode(parent)
          ? parent
          : null;

      if (!linkNode) {
        setActiveLink(null);
        return;
      }

      const linkElement = editor.getElementByKey(linkNode.getKey());
      if (!linkElement) {
        setActiveLink(null);
        return;
      }

      const linkRect = linkElement.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      setActiveLink({
        key: linkNode.getKey(),
        top: linkRect.bottom - anchorRect.top + 6,
        left: linkRect.left - anchorRect.left,
      });
    });
  }, [editor, anchorElem]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => updateActiveLink()),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateActiveLink();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateActiveLink]);

  React.useEffect(() => {
    const handler = () => updateActiveLink();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [updateActiveLink]);

  // Reset dismissal when the cursor moves to a different link
  React.useEffect(() => {
    if (!activeLink) {
      setDismissedKey(null);
      return;
    }
    if (dismissedKey && activeLink.key !== dismissedKey) {
      setDismissedKey(null);
    }
  }, [activeLink, dismissedKey]);

  const visible =
    activeLink !== null && activeLink.key !== dismissedKey;

  if (!visible || !activeLink) return null;

  return createPortal(
    <div
      className="absolute z-30 rounded-lg border border-zinc-200 bg-white shadow-lg p-3 w-80"
      style={{ top: activeLink.top, left: activeLink.left }}
    >
      <LinkEditForm
        key={activeLink.key}
        autoFocusUrl={false}
        showCancel
        onClose={() => setDismissedKey(activeLink.key)}
      />
    </div>,
    anchorElem,
  );
}

RichTextLinkEditor.displayName = "RichTextLinkEditor";
