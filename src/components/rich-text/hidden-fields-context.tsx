"use client";

import * as React from "react";

/**
 * Fields to hide, keyed by block type (`"image"`, `"galeri"`,
 * `"newsMoment"`, …). The `"*"` key applies to every block.
 *
 * ```ts
 * { image: ["caption", "maxWidth"], "*": ["position"] }
 * ```
 */
export type HiddenFieldsConfig = Record<string, string[]>;

const HiddenFieldsContext = React.createContext<HiddenFieldsConfig | null>(
  null,
);

export function HiddenFieldsProvider({
  children,
  hiddenFields,
}: {
  children: React.ReactNode;
  hiddenFields?: HiddenFieldsConfig;
}) {
  return (
    <HiddenFieldsContext.Provider value={hiddenFields ?? null}>
      {children}
    </HiddenFieldsContext.Provider>
  );
}

/** The raw config, for callers that serialize rather than render. */
export function useHiddenFieldsConfig(): HiddenFieldsConfig | null {
  return React.useContext(HiddenFieldsContext);
}

/** Field names hidden for one block type, including the `"*"` entries. */
export function hiddenFieldsFor(
  config: HiddenFieldsConfig | null | undefined,
  blockType: string,
): Set<string> {
  if (!config) return new Set();
  return new Set([...(config["*"] ?? []), ...(config[blockType] ?? [])]);
}

/**
 * `isHidden(fieldName)` for one block type — used by the forms to skip
 * rendering a field.
 */
export function useHiddenFields(blockType: string): (field: string) => boolean {
  const config = useHiddenFieldsConfig();
  return React.useMemo(() => {
    const hidden = hiddenFieldsFor(config, blockType);
    return (field: string) => hidden.has(field);
  }, [config, blockType]);
}

type Serialized = Record<string, unknown>;

/**
 * Structural keys Lexical owns. Deleting one corrupts the document —
 * dropping `children` from the root empties it outright — so a config
 * naming one of these is ignored rather than obeyed.
 */
const PROTECTED_KEYS = new Set([
  "type",
  "version",
  "format",
  "indent",
  "direction",
  "children",
  "textFormat",
  "textStyle",
  "state",
]);

/**
 * Remove hidden fields from a serialized editor state, so they never
 * reach the host's payload.
 *
 * A name is dropped whether it sits at the node's top level (CMS blocks
 * store fields flat) or inside its `options` object (the built-in media
 * blocks) — callers name the field, not its nesting. Lexical's own keys
 * are never touched.
 *
 * Mutates and returns the given object; pass a copy to keep the original.
 */
export function stripHiddenFields<T>(
  serialized: T,
  config: HiddenFieldsConfig | null | undefined,
): T {
  if (!config || Object.keys(config).length === 0) return serialized;

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;

    const record = node as Serialized;
    if (typeof record.type === "string") {
      const hidden = hiddenFieldsFor(config, record.type);
      for (const name of hidden) {
        if (PROTECTED_KEYS.has(name)) continue;
        delete record[name];
        const options = record.options;
        if (options && typeof options === "object") {
          delete (options as Serialized)[name];
        }
      }
    }

    for (const value of Object.values(record)) {
      if (value && typeof value === "object") visit(value);
    }
  };

  visit(serialized);
  return serialized;
}
