/**
 * Lexical stores inline text formatting in two different places:
 *
 * - `format` — a **bitmask** of the toggles (bold, italic, underline …)
 * - `style`  — a CSS string, written by `$patchStyleText` (colour,
 *              background colour, font size …)
 *
 * That split is awkward to consume downstream, where you usually just
 * want "the CSS for this run of text". These helpers decode the bitmask
 * and merge both halves into a single declaration string.
 */

/** Bit for each inline format. Mirrors `IS_*` in Lexical's constants. */
export const TEXT_FORMAT_BITS = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
  highlight: 128,
  lowercase: 256,
  uppercase: 512,
  capitalize: 1024,
} as const;

export type TextFormatName = keyof typeof TEXT_FORMAT_BITS;

/** Does this bitmask include the given format? */
export function hasTextFormat(format: number, name: TextFormatName): boolean {
  return (format & TEXT_FORMAT_BITS[name]) !== 0;
}

/** Every format switched on in the bitmask, e.g. `9` → `["bold", "underline"]`. */
export function decodeTextFormat(format: number): TextFormatName[] {
  return (Object.keys(TEXT_FORMAT_BITS) as TextFormatName[]).filter((name) =>
    hasTextFormat(format, name),
  );
}

export interface TextCssOptions {
  /** Background used for the `highlight` format. */
  highlightColor?: string;
  /** Font stack used for the `code` format. */
  codeFontFamily?: string;
  /** Background used for the `code` format. Pass `""` to skip it. */
  codeBackground?: string;
}

const DEFAULTS: Required<TextCssOptions> = {
  highlightColor: "#fef08a",
  codeFontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  codeBackground: "#f4f4f5",
};

/**
 * CSS declarations for a format bitmask.
 *
 * `underline` and `strikethrough` deliberately collapse into a single
 * `text-decoration`; emitting them as two declarations would make the
 * second overwrite the first and silently drop one of the two.
 */
export function textFormatToCss(
  format: number,
  options: TextCssOptions = {},
): Record<string, string> {
  const opts = { ...DEFAULTS, ...options };
  const css: Record<string, string> = {};

  if (hasTextFormat(format, "bold")) css["font-weight"] = "700";
  if (hasTextFormat(format, "italic")) css["font-style"] = "italic";

  const decorations: string[] = [];
  if (hasTextFormat(format, "underline")) decorations.push("underline");
  if (hasTextFormat(format, "strikethrough")) decorations.push("line-through");
  if (decorations.length > 0) css["text-decoration"] = decorations.join(" ");

  if (hasTextFormat(format, "code")) {
    css["font-family"] = opts.codeFontFamily;
    if (opts.codeBackground) css["background-color"] = opts.codeBackground;
  }
  if (hasTextFormat(format, "highlight")) {
    css["background-color"] = opts.highlightColor;
  }

  if (hasTextFormat(format, "subscript")) {
    css["vertical-align"] = "sub";
    css["font-size"] = "smaller";
  }
  if (hasTextFormat(format, "superscript")) {
    css["vertical-align"] = "super";
    css["font-size"] = "smaller";
  }

  if (hasTextFormat(format, "lowercase")) css["text-transform"] = "lowercase";
  if (hasTextFormat(format, "uppercase")) css["text-transform"] = "uppercase";
  if (hasTextFormat(format, "capitalize")) {
    css["text-transform"] = "capitalize";
  }

  return css;
}

/** Parse a CSS declaration string into a map. */
export function parseCssText(style: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of style.split(";")) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    const prop = part.slice(0, colon).trim();
    const value = part.slice(colon + 1).trim();
    if (prop && value) out[prop] = value;
  }
  return out;
}

/** Serialize a declaration map back into a CSS string. */
export function stringifyCss(css: Record<string, string>): string {
  return Object.entries(css)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");
}

/**
 * One CSS string covering everything applied to a run of text.
 *
 * The node's own `style` is applied last, so an explicitly picked colour
 * beats one implied by a format bit (e.g. a custom background colour
 * wins over `highlight`'s default yellow).
 */
export function textNodeCss(
  format: number,
  style: string = "",
  options: TextCssOptions = {},
): string {
  return stringifyCss({
    ...textFormatToCss(format, options),
    ...parseCssText(style),
  });
}

export interface InlineTextStyleOptions extends TextCssOptions {
  /**
   * Key the computed CSS is written under. Defaults to `"css"`.
   *
   * Avoid `"style"`: Lexical reads that key back on import into the
   * node's own `style`, so the derived declarations would become real
   * ones — and toggling bold off would no longer clear `font-weight`,
   * because that toggle only touches `format`. Keeping a separate key
   * leaves the JSON safe to feed back into `initialJson` / `setJson`.
   */
  key?: string;
}

type Serialized = Record<string, unknown>;

/**
 * Walk a serialized editor state and add a ready-to-use CSS string to
 * every text node, so consumers never have to decode the bitmask.
 *
 * ```ts
 * const json = JSON.parse(editorRef.current.getJson());
 * withInlineTextStyles(json);
 * // { type: "text", text: "Merhaba", format: 9, style: "color: #ef4444;",
 * //   css: "font-weight: 700; text-decoration: underline; color: #ef4444" }
 * ```
 *
 * Returns the same object it was given (mutated in place) for easy
 * chaining; pass a copy if you need the original untouched.
 */
export function withInlineTextStyles<T>(
  serialized: T,
  options: InlineTextStyleOptions = {},
): T {
  const { key = "css", ...cssOptions } = options;

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Serialized;
    if (record.type === "text") {
      const format = typeof record.format === "number" ? record.format : 0;
      const style = typeof record.style === "string" ? record.style : "";
      const css = textNodeCss(format, style, cssOptions);
      if (css) record[key] = css;
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") visit(value);
    }
  };

  visit(serialized);
  return serialized;
}
