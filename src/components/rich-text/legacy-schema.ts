import type * as React from "react";

export interface LegacyFieldOption {
  value: string;
  label: string;
}

export interface LegacyFieldSpec {
  /** Key under which this field's value is stored — becomes the field
   *  name in the `#type#field#value#` output. */
  name: string;
  label: string;
  inputType: "text" | "url" | "number" | "select" | "textarea";
  options?: LegacyFieldOption[];
  placeholder?: string;
  optional?: boolean;
}

export interface LegacyComponentSpec {
  /** Shortcode type keyword, e.g. `"resim"`, `"video"` — entirely up to
   *  the consumer, not constrained by this library. */
  type: string;
  title: string;
  description?: string;
  /** Menu icon (Insert dropdown / slash menu). Falls back to a generic
   *  icon when omitted — see `createLegacyComponentBlocks`. */
  icon?: React.ReactElement;
  fields: LegacyFieldSpec[];
}
