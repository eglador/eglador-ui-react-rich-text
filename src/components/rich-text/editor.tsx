"use client";

import * as React from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { PageBreakPlugin } from "./page-break";
import {
  TRANSFORMERS,
  $convertFromMarkdownString,
  $convertToMarkdownString,
} from "@lexical/markdown";
import {
  $generateHtmlFromNodes,
  $generateNodesFromDOM,
} from "@lexical/html";
import type {
  InitialConfigType,
  InitialEditorStateType,
} from "@lexical/react/LexicalComposer";
import type { EditorState, LexicalEditor } from "lexical";
import { $getRoot, $isElementNode, $createParagraphNode } from "lexical";
import { cn } from "../../lib/utils";
import { defaultTheme } from "./theme";
import { defaultNodes } from "./nodes";
import { PageSizeProvider } from "./page-size-context";
import type { RichTextEditorProps } from "./types";

function buildInitialState(
  initialMarkdown: string | undefined,
  initialHtml: string | undefined,
  initialJson: string | undefined,
): InitialEditorStateType | null {
  // Priority: markdown > html > json
  if (initialMarkdown) {
    return () => $convertFromMarkdownString(initialMarkdown, TRANSFORMERS);
  }

  if (initialHtml) {
    return (editor: LexicalEditor) => {
      const dom = new DOMParser().parseFromString(initialHtml, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      nodes.forEach((node) => {
        if ($isElementNode(node)) {
          root.append(node);
        } else {
          root.append($createParagraphNode().append(node));
        }
      });
    };
  }

  if (initialJson) {
    return initialJson;
  }

  return null;
}

function EditorRefPlugin({
  editorRef,
}: {
  editorRef: NonNullable<RichTextEditorProps["editorRef"]>;
}) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    if (typeof editorRef === "function") {
      editorRef(editor);
    } else {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);
  return null;
}

/**
 * Syncs the `editable` prop after mount. `initialConfig.editable` only
 * applies once at mount, so toggling the prop later requires the imperative
 * `editor.setEditable()` API.
 */
function EditableSyncPlugin({ editable }: { editable: boolean }) {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => {
    editor.setEditable(editable);
  }, [editor, editable]);
  return null;
}

export function RichTextEditor({
  initialJson,
  initialHtml,
  initialMarkdown,
  onChange,
  editable = true,
  autoFocus = false,
  namespace = "eglador-rich-text",
  editorRef,
  className,
  children,
  ...props
}: RichTextEditorProps) {
  const initialConfig = React.useMemo<InitialConfigType>(
    () => ({
      namespace,
      theme: defaultTheme,
      nodes: defaultNodes,
      editable,
      editorState: buildInitialState(
        initialMarkdown,
        initialHtml,
        initialJson,
      ),
      onError: (error) => {
        throw error;
      },
    }),
    // initial state is captured once at mount; later changes use the imperative API
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namespace],
  );

  const handleChange = React.useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (!onChange) return;
      editorState.read(() => {
        const json = JSON.stringify(editorState.toJSON());
        const html = $generateHtmlFromNodes(editor);
        const text = $getRoot().getTextContent();
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onChange({ json, html, text, markdown });
      });
    },
    [onChange],
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 bg-white text-zinc-900 overflow-hidden",
        className,
      )}
      {...props}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <PageSizeProvider>{children}</PageSizeProvider>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin hasCellMerge hasCellBackgroundColor hasTabHandler />
        <PageBreakPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        {autoFocus && <AutoFocusPlugin />}
        {onChange && <OnChangePlugin onChange={handleChange} />}
        {editorRef && <EditorRefPlugin editorRef={editorRef} />}
        <EditableSyncPlugin editable={editable} />
      </LexicalComposer>
    </div>
  );
}

RichTextEditor.displayName = "RichTextEditor";
