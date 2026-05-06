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
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { SelectionAlwaysOnDisplay } from "@lexical/react/LexicalSelectionAlwaysOnDisplay";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { registerDragonSupport } from "@lexical/dragon";
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

/**
 * Registers `@lexical/dragon` keyboard-driven drag handlers — improves a11y
 * for screen readers (e.g. ChromeVox) by enabling text-selection commands
 * the regular DOM Range API doesn't expose.
 */
function DragonSupportPlugin(): null {
  const [editor] = useLexicalComposerContext();
  React.useEffect(() => registerDragonSupport(editor), [editor]);
  return null;
}

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/;
const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const AUTO_LINK_MATCHERS = [
  (text: string) => {
    const match = URL_REGEX.exec(text);
    if (match === null) return null;
    const fullMatch = match[0];
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
    };
  },
  (text: string) => {
    const match = EMAIL_REGEX.exec(text);
    if (match === null) return null;
    return {
      index: match.index,
      length: match[0].length,
      text: match[0],
      url: `mailto:${match[0]}`,
    };
  },
];

export function RichTextEditor({
  initialJson,
  initialHtml,
  initialMarkdown,
  onChange,
  editable = true,
  autoFocus = false,
  namespace = "eglador-rich-text",
  maxLength,
  charset = "UTF-16",
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
        <CheckListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
        <ClickableLinkPlugin />
        <HorizontalRulePlugin />
        <TablePlugin hasCellMerge hasCellBackgroundColor hasTabHandler />
        <PageBreakPlugin />
        <HashtagPlugin />
        <TabIndentationPlugin />
        <SelectionAlwaysOnDisplay />
        <DragonSupportPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        {maxLength != null && (
          <CharacterLimitPlugin maxLength={maxLength} charset={charset} />
        )}
        {autoFocus && <AutoFocusPlugin />}
        {onChange && <OnChangePlugin onChange={handleChange} />}
        {editorRef && <EditorRefPlugin editorRef={editorRef} />}
        <EditableSyncPlugin editable={editable} />
      </LexicalComposer>
    </div>
  );
}

RichTextEditor.displayName = "RichTextEditor";
