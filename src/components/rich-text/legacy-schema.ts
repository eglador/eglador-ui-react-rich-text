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
  /**
   * Custom output mask for this type's shortcode string, e.g.
   * `"#{type}#{ID}#"`. `{type}` is replaced with `type`; `{fieldName}`
   * placeholders (matching a field's `name`) are replaced with that
   * field's submitted value. Any field not referenced by the template is
   * simply omitted from the output.
   *
   * Omit to use the default `#type#field#value#field#value#...#` layout
   * (every field rendered as its `name` followed by its value), e.g.
   * `{ type: "resim", fields: [{ name: "ID", ... }] }` → `#resim#ID#345456#`.
   * With `template: "#{type}#{ID}#"` the same submission instead renders
   * `#resim#345456#`.
   */
  template?: string;
}
