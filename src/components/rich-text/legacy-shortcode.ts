/**
 * Fully generic `#type#field#value#field#value#` shortcode format.
 *
 * Nothing here knows about any concrete component type (video, image,
 * quote, ...) — the set of types and their fields is entirely defined by
 * the consumer's own `LegacyComponentSpec[]` (see legacy-schema.ts) and
 * passed in at runtime via `createLegacyComponentBlocks()`. This module
 * only knows how to serialize/parse the generic `{ type, fields }` shape.
 */
export interface LegacyComponentInput {
  type: string;
  fields: Record<string, string | number>;
}

/** Fills a `{placeholder}` template with a component's data — `{type}`
 *  becomes `input.type`; any other `{name}` becomes the value of the
 *  field called `name`. Placeholders for fields that aren't present in
 *  `input.fields` are left untouched (so a typo surfaces visibly rather
 *  than silently vanishing). */
export function renderLegacyShortcodeTemplate(
  template: string,
  input: LegacyComponentInput,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (key === "type") return input.type;
    const value = input.fields[key];
    return value === undefined ? match : String(value);
  });
}

/** Renders a typed component into its shortcode string. With no
 *  `template`, falls back to the default `#type#field#value#field#value#`
 *  layout (field order follows `Object.entries` insertion order). A
 *  `template` (see `LegacyComponentSpec.template`) renders via
 *  {@link renderLegacyShortcodeTemplate} instead — e.g. `"#{type}#{ID}#"`
 *  produces `#resim#345456#` instead of `#resim#ID#345456#`. */
export function legacyComponentToShortcode(
  input: LegacyComponentInput,
  template?: string,
): string {
  if (template) return renderLegacyShortcodeTemplate(template, input);

  const parts: string[] = [];
  for (const [name, value] of Object.entries(input.fields)) {
    parts.push(name, String(value));
  }
  return `#${input.type}#${parts.map((part) => `${part}#`).join("")}`;
}

/** Parses a single `#type#field#value#field#value#` line back into the
 *  generic `{ type, fields }` shape, or `null` if it isn't a well-formed
 *  *default-format* shortcode line (must start/end with `#` and have an
 *  even number of field/value segments after the type). Lines produced
 *  via a custom `template` won't round-trip through this — use
 *  {@link isLegacyShortcodeLine} if you only need to detect/extract the
 *  raw string, not reconstruct its fields. */
export function parseLegacyShortcode(line: string): LegacyComponentInput | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("#") || !trimmed.endsWith("#")) return null;
  const [type, ...rest] = trimmed.slice(1, -1).split("#");
  if (!type || rest.length % 2 !== 0) return null;

  const fields: Record<string, string> = {};
  for (let i = 0; i < rest.length; i += 2) {
    fields[rest[i]] = rest[i + 1];
  }
  return { type, fields };
}

/** Loosely detects "this is a legacy shortcode line" — starts and ends
 *  with `#` and has a non-empty type segment — without assuming the
 *  default field/value-paired layout. Works for any `template`, since it
 *  doesn't try to reconstruct fields. */
export function isLegacyShortcodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.startsWith("#") || !trimmed.endsWith("#")) return false;
  const [type] = trimmed.slice(1, -1).split("#");
  return Boolean(type);
}
