/**
 * Turning a pasted embed snippet into the bare URL a block stores.
 *
 * Google Maps, YouTube and friends hand out a full `<iframe …>` tag from
 * their Share dialogs, and that is what authors paste. The URL fields
 * keep only the `src`.
 */

const IFRAME_SRC =
  /<iframe[^>]*?\ssrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

/** `&amp;` → `&`, `&#38;` → `&`. Embed codes are HTML, so their query
 *  strings arrive escaped. */
function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1] === "x" || entity[1] === "X"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * The `src` of a pasted `<iframe>`, or the input untouched when it isn't
 * one — so this can sit on a URL field's `onChange` without getting in
 * the way of ordinary typing.
 *
 * ```
 * <iframe src="https://www.google.com/maps/embed?pb=!1m18…" width="600">
 * → https://www.google.com/maps/embed?pb=!1m18…
 * ```
 */
export function extractEmbedSrc(input: string): string {
  if (!input.includes("<")) return input;
  const match = IFRAME_SRC.exec(input);
  if (!match) return input;
  const src = match[1] ?? match[2] ?? match[3] ?? "";
  return src ? decodeEntities(src).trim() : input;
}
