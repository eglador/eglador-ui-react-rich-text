import type * as React from "react";
import type { LexicalEditor } from "lexical";

export type RichTextValue = {
  /** Lexical editor state JSON */
  json: string;
  /** Serialized HTML */
  html: string;
  /** Plain text content */
  text: string;
  /** Markdown serialization (via @lexical/markdown TRANSFORMERS) */
  markdown: string;
};

export interface RichTextEditorProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Initial Lexical editor state JSON (string) */
  initialJson?: string;
  /** Initial HTML — parsed and loaded into the editor on mount */
  initialHtml?: string;
  /** Initial Markdown — parsed and loaded via TRANSFORMERS on mount */
  initialMarkdown?: string;
  /** Called on every editor state change */
  onChange?: (value: RichTextValue) => void;
  /** Read-only mode when false (default true) */
  editable?: boolean;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
  /** Lexical namespace (default "eglador-rich-text") */
  namespace?: string;
  /** Receive the LexicalEditor instance once initialized (escape hatch) */
  editorRef?:
    | React.MutableRefObject<LexicalEditor | null>
    | ((editor: LexicalEditor) => void);
  children: React.ReactNode;
}
