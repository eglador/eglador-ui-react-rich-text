import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type LexicalEditor,
} from "lexical";
import type { RichTextLocale } from "./i18n";

export type TextCaseMode = "upper" | "lower" | "title";

/**
 * Casing has to follow the text's own language, not the browser's.
 * Turkish has two i's: `i` uppercases to `İ` and `I` lowercases to `ı`,
 * which plain `toUpperCase()` / `toLowerCase()` get wrong.
 */
const localeTag = (locale: RichTextLocale | undefined) =>
  locale === "en" ? "en-US" : "tr-TR";

/** A letter, or a mark that belongs to the letter before it. */
const LETTER = /[\p{L}\p{M}]/u;
/** Characters that keep a word going, so `İstanbul'da` stays one word. */
const WORD_GLUE = /['’\p{L}\p{M}\p{N}]/u;

export const toUpperCaseText = (
  text: string,
  locale?: RichTextLocale,
): string => text.toLocaleUpperCase(localeTag(locale));

export const toLowerCaseText = (
  text: string,
  locale?: RichTextLocale,
): string => text.toLocaleLowerCase(localeTag(locale));

/**
 * Capitalise the first letter of each word, lowercasing the rest.
 *
 * `previous` is the character just before this chunk, so a word split
 * across two text nodes by formatting (`kita` + **`plar`**) is not
 * capitalised in the middle.
 */
export function toTitleCaseText(
  text: string,
  locale?: RichTextLocale,
  previous = "",
): string {
  const tag = localeTag(locale);
  let out = "";
  let atWordStart = !WORD_GLUE.test(previous);

  for (const char of text.toLocaleLowerCase(tag)) {
    if (LETTER.test(char)) {
      out += atWordStart ? char.toLocaleUpperCase(tag) : char;
      atWordStart = false;
    } else {
      out += char;
      // An apostrophe or digit continues the word (`2024'te`, `Ali'nin`).
      atWordStart = !WORD_GLUE.test(char);
    }
  }
  return out;
}

export function applyTextCase(
  text: string,
  mode: TextCaseMode,
  locale?: RichTextLocale,
  previous = "",
): string {
  if (mode === "upper") return toUpperCaseText(text, locale);
  if (mode === "lower") return toLowerCaseText(text, locale);
  return toTitleCaseText(text, locale, previous);
}

/**
 * Re-case the selected text in place, keeping the selection so the
 * author can try another casing straight away.
 *
 * `extract()` splits text nodes at the selection boundaries and returns
 * only what is inside it, so formatting on the surrounding text — and on
 * the selection's own runs — survives.
 */
export function transformSelectionCase(
  editor: LexicalEditor,
  mode: TextCaseMode,
  locale?: RichTextLocale,
): void {
  editor.update(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || selection.isCollapsed()) return;

    const nodes = selection.extract();
    // Carried across nodes so title case sees whole words.
    let previous = "";
    for (const node of nodes) {
      if (!$isTextNode(node)) continue;
      const text = node.getTextContent();
      node.setTextContent(applyTextCase(text, mode, locale, previous));
      previous = text.slice(-1);
    }
  });
}
