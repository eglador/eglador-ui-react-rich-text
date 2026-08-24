"use client";

import * as React from "react";

/**
 * One selectable item in the page's image library.
 *
 * `id` is the only required field — that's what gets stored on the node.
 * Everything else is a display convenience: leave `url` out and the
 * thumbnail is resolved through `resolveImageSrc` like any other ID, so
 * handing over a plain list of IDs is enough.
 */
export interface MediaLibraryItem {
  id: string;
  /** Optional direct URL. Falls back to `resolveImageSrc(id)`. */
  url?: string;
  /** Optional caption shown under the thumbnail. */
  title?: string;
}

/** A static list, or a function returning one (optionally async). */
export type MediaLibrary =
  | MediaLibraryItem[]
  | (() => MediaLibraryItem[] | Promise<MediaLibraryItem[]>);

const MediaLibraryContext = React.createContext<MediaLibrary | null>(null);

export function MediaLibraryProvider({
  children,
  library,
}: {
  children: React.ReactNode;
  library?: MediaLibrary;
}) {
  return (
    <MediaLibraryContext.Provider value={library ?? null}>
      {children}
    </MediaLibraryContext.Provider>
  );
}

export type MediaLibraryStatus = "idle" | "loading" | "ready";

export interface MediaLibraryState {
  items: MediaLibraryItem[];
  status: MediaLibraryStatus;
  /** `false` when the host configured no library at all — callers use
   *  this to keep the manual ID/URL inputs editable. */
  configured: boolean;
}

/**
 * Read the configured image library, loading it if it's a function.
 *
 * A loader is called once per mount; results arriving after unmount are
 * ignored so a slow fetch can't set state on a dead component.
 */
export function useMediaLibrary(): MediaLibraryState {
  const library = React.useContext(MediaLibraryContext);
  const [items, setItems] = React.useState<MediaLibraryItem[]>([]);
  const [status, setStatus] = React.useState<MediaLibraryStatus>("idle");

  React.useEffect(() => {
    if (!library) {
      setItems([]);
      setStatus("idle");
      return;
    }
    if (Array.isArray(library)) {
      setItems(library);
      setStatus("ready");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    let result: MediaLibraryItem[] | Promise<MediaLibraryItem[]>;
    try {
      result = library();
    } catch {
      setItems([]);
      setStatus("ready");
      return;
    }

    if (result instanceof Promise) {
      result.then(
        (list) => {
          if (cancelled) return;
          setItems(list ?? []);
          setStatus("ready");
        },
        () => {
          if (cancelled) return;
          setItems([]);
          setStatus("ready");
        },
      );
    } else {
      setItems(result ?? []);
      setStatus("ready");
    }

    return () => {
      cancelled = true;
    };
  }, [library]);

  return { items, status, configured: library !== null };
}
