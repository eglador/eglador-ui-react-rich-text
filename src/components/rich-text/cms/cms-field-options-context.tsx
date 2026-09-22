"use client";

import * as React from "react";
import type { CmsFieldOption } from "./cms-types";

/** A fixed list, or a function returning one (optionally async). */
export type CmsFieldOptionsSource =
  | CmsFieldOption[]
  | (() => CmsFieldOption[] | Promise<CmsFieldOption[]>);

/**
 * Replacement dropdown choices, keyed by block type and then field name.
 * The `"*"` block key applies to every block, so a field shared across
 * blocks (`position`) can be set once.
 *
 * ```ts
 * {
 *   canliyayin: { channel: [{ value: "300", label: "BHT TV" }] },
 *   piyasa: { usd_eur: async () => fetchMarkets() },
 *   "*": { position: [{ value: "left", label: "Sola yaslı" }] },
 * }
 * ```
 */
export type CmsFieldOptionsConfig = Record<
  string,
  Record<string, CmsFieldOptionsSource>
>;

/** `Promise` = in flight, array = loaded, `null` = the loader failed. */
type CacheEntry = CmsFieldOption[] | Promise<CmsFieldOption[]> | null;

interface ResolverContext {
  config: CmsFieldOptionsConfig;
  /** Loader results, kept for the editor's lifetime so reopening a form
   *  doesn't refetch. */
  cache: Map<string, CacheEntry>;
}

const Context = React.createContext<ResolverContext | null>(null);

export function CmsFieldOptionsProvider({
  children,
  cmsFieldOptions,
}: {
  children: React.ReactNode;
  cmsFieldOptions?: CmsFieldOptionsConfig;
}) {
  const value = React.useMemo<ResolverContext | null>(
    // A new config starts a new cache — earlier lists may be stale.
    () => (cmsFieldOptions ? { config: cmsFieldOptions, cache: new Map() } : null),
    [cmsFieldOptions],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export type CmsFieldOptionsStatus = "schema" | "loading" | "ready" | "error";

export interface CmsFieldOptionsState {
  options: CmsFieldOption[];
  status: CmsFieldOptionsStatus;
  /** `true` when the host supplied a list for this field. */
  overridden: boolean;
}

/**
 * The choices for one select field: whatever the host configured for
 * this block type (or for `"*"`), else the schema's own list.
 *
 * While an async loader runs, the schema list is held back and `status`
 * is `"loading"` — better a momentarily empty select than the author
 * picking a channel that is about to disappear. If the loader rejects,
 * the schema list comes back so the form stays usable.
 */
export function useCmsFieldOptions(
  blockType: string,
  fieldName: string,
  schemaOptions: CmsFieldOption[] = [],
): CmsFieldOptionsState {
  const resolver = React.useContext(Context);
  const source =
    resolver?.config[blockType]?.[fieldName] ??
    resolver?.config["*"]?.[fieldName];
  const isLoader = Boolean(source) && !Array.isArray(source);
  const cacheKey = `${blockType}.${fieldName}`;
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (!resolver || !isLoader) return;
    const settled = resolver.cache.get(cacheKey);
    // An array or an explicit null means this key is done.
    if (settled !== undefined && !(settled instanceof Promise)) return;

    let cancelled = false;
    let pending = settled;
    if (!pending) {
      pending = Promise.resolve()
        .then(source as () => CmsFieldOption[] | Promise<CmsFieldOption[]>)
        .then((options) => {
          resolver.cache.set(cacheKey, options);
          return options;
        })
        .catch((error) => {
          resolver.cache.set(cacheKey, null);
          console.error(
            `[eglador-ui-react-rich-text] cmsFieldOptions loader failed for "${cacheKey}", falling back to the built-in list:`,
            error,
          );
          return [];
        });
      resolver.cache.set(cacheKey, pending);
    }
    void pending.then(() => {
      if (!cancelled) rerender();
    });
    return () => {
      cancelled = true;
    };
  }, [resolver, isLoader, source, cacheKey]);

  if (!source) {
    return { options: schemaOptions, status: "schema", overridden: false };
  }
  if (Array.isArray(source)) {
    return { options: source, status: "ready", overridden: true };
  }

  const entry = resolver!.cache.get(cacheKey);
  if (Array.isArray(entry)) {
    return { options: entry, status: "ready", overridden: true };
  }
  if (entry === null) {
    return { options: schemaOptions, status: "error", overridden: false };
  }
  // Undefined (the effect has not run yet) or still pending.
  return { options: [], status: "loading", overridden: true };
}
