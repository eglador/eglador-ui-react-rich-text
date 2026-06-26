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

/** Renders a typed component into its `#type#field#value#field#value#`
 *  string — field order follows `Object.entries` insertion order. */
export function legacyComponentToShortcode(input: LegacyComponentInput): string {
  const parts: string[] = [];
  for (const [name, value] of Object.entries(input.fields)) {
    parts.push(name, String(value));
  }
  return `#${input.type}#${parts.map((part) => `${part}#`).join("")}`;
}

/** Parses a single `#type#field#value#field#value#` line back into the
 *  generic `{ type, fields }` shape, or `null` if it isn't a well-formed
 *  shortcode line (must start/end with `#` and have an even number of
 *  field/value segments after the type). */
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
