import type * as React from "react";
import type { LexicalEditor } from "lexical";
import type { MediaResolver } from "./media-resolver-context";
import type { InlineTextStyleOptions } from "./text-styles";

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
  /** Maximum character count. When set, content past the limit is wrapped
   *  in an `OverflowNode` and visually marked. */
  maxLength?: number;
  /** Charset for character counting (default `"UTF-16"`). UTF-8 counts
   *  emoji and CJK characters as multiple bytes; UTF-16 matches `String.length`. */
  charset?: "UTF-8" | "UTF-16";
  /**
   * Turns a CMS media ID into a displayable URL. Called by any block
   * that stores an ID instead of a URL — the `image` / `video` blocks in
   * ID mode, and CMS blocks with `image-ids` fields (e.g. `newsMoment`).
   *
   * May be sync (an in-memory map) or async (a fetch). Return `null`
   * when the ID has no media, and the block renders a placeholder
   * instead of a broken image.
   */
  resolveImageSrc?: MediaResolver;
  /**
   * Add a ready-to-use `css` string to every text node in the JSON —
   * merging the `format` bitmask with the node's `style`, so consumers
   * never decode `format: 9` by hand. **On by default**, affecting
   * `onChange`'s `json`, `useRichTextEditor().getJson()` and the
   * `RichTextOutput` JSON tab.
   *
   * The key is additive: the JSON still imports cleanly via
   * `initialJson` / `setJson`. Pass `false` for the raw Lexical shape,
   * or an options object to tune the `highlight` / `code` colours.
   */
  inlineTextStyles?: boolean | InlineTextStyleOptions;
  /** Receive the LexicalEditor instance once initialized (escape hatch) */
  editorRef?:
    | React.MutableRefObject<LexicalEditor | null>
    | ((editor: LexicalEditor) => void);
  children: React.ReactNode;
}
