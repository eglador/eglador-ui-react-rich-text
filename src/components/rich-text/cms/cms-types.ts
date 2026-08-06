import type * as React from "react";

export interface CmsFieldOption {
  value: string;
  label: string;
}

export type CmsFieldInputType =
  | "text"
  | "url"
  | "number"
  | "select"
  | "textarea"
  /** Native date picker. Stored as `YYYY-MM-DD`. */
  | "date"
  /** Native time picker. Stored as `HH:mm`. */
  | "time"
  /** Comma-separated media IDs, previewed as thumbnails via the
   *  resolver passed to `RichTextEditor`. */
  | "image-ids";

export interface CmsFieldSpec {
  /** Key this field is stored under — becomes a top-level key in the
   *  node's serialized JSON. */
  name: string;
  label: string;
  inputType: CmsFieldInputType;
  options?: CmsFieldOption[];
  placeholder?: string;
  optional?: boolean;
}

/** Field values as stored on the node. Everything is a string; numeric
 *  fields are parsed by the consumer. */
export type CmsFieldValues = Record<string, string>;

export interface CmsBlockSpec {
  /**
   * Lexical node type — also the `"type"` key in serialized JSON.
   * Must be unique across every registered node.
   */
  type: string;
  title: string;
  description?: string;
  /** Menu icon (Insert dropdown / slash menu). */
  icon: React.ReactElement;
  /** Extra search terms for the slash filter. `type` and `title` are
   *  matched automatically. */
  keywords?: string[];
  fields: CmsFieldSpec[];
  /**
   * Custom in-editor preview. Omit to get the generic card (title +
   * field summary). Rendered inside the block's decorator, so it can
   * use `useResolvedSrc()` to turn IDs into images.
   */
  renderPreview?: (fields: CmsFieldValues) => React.ReactNode;
}
