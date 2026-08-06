"use client";

import * as React from "react";

/**
 * Resolves a CMS media ID into a displayable URL. May be synchronous
 * (an in-memory map) or asynchronous (a fetch against the host app's
 * media API). Returning `null` means "no such media" — the block then
 * renders a not-found placeholder instead of a broken image.
 */
export type MediaResolver = (
  id: string,
) => string | null | Promise<string | null>;

interface MediaResolverContextValue {
  resolveImageSrc: MediaResolver | null;
}

const MediaResolverContext =
  React.createContext<MediaResolverContextValue | null>(null);

interface MediaResolverProviderProps {
  children: React.ReactNode;
  resolveImageSrc?: MediaResolver;
}

/**
 * Makes the host app's media resolver available to decorator nodes.
 * Provided automatically by `RichTextEditor`.
 *
 * Decorator nodes are rendered through `createPortal` from inside
 * `<RichTextContent>`, and React portals inherit context from the
 * *component* tree rather than the DOM tree — so wrapping `children`
 * here is enough to reach every block's preview.
 */
export function MediaResolverProvider({
  children,
  resolveImageSrc,
}: MediaResolverProviderProps) {
  const value = React.useMemo<MediaResolverContextValue>(
    () => ({ resolveImageSrc: resolveImageSrc ?? null }),
    [resolveImageSrc],
  );
  return (
    <MediaResolverContext.Provider value={value}>
      {children}
    </MediaResolverContext.Provider>
  );
}

/**
 * Read the configured resolver. Falls back to `null` when no provider is
 * mounted, so blocks render harmlessly outside an editor.
 */
export function useMediaResolver(): MediaResolver | null {
  return React.useContext(MediaResolverContext)?.resolveImageSrc ?? null;
}

export type ResolvedSrcStatus =
  /** No id was requested — nothing to resolve. */
  | "idle"
  /** An async resolver is in flight. */
  | "loading"
  /** `src` holds a usable URL. */
  | "resolved"
  /** The resolver returned null/threw, or none is configured. */
  | "missing";

export interface ResolvedSrc {
  src: string | null;
  status: ResolvedSrcStatus;
}

/**
 * Turn a media ID into a URL via the host-supplied resolver.
 *
 * Handles both sync and async resolvers, and ignores results from a
 * previous ID that land after the ID has already changed (or after
 * unmount) so a slow request can't overwrite a newer one.
 */
export function useResolvedSrc(id: string | null | undefined): ResolvedSrc {
  const resolver = useMediaResolver();
  const [state, setState] = React.useState<ResolvedSrc>({
    src: null,
    status: "idle",
  });

  React.useEffect(() => {
    const trimmed = id?.trim();
    if (!trimmed) {
      setState({ src: null, status: "idle" });
      return;
    }
    if (!resolver) {
      setState({ src: null, status: "missing" });
      return;
    }

    let cancelled = false;
    const settle = (src: string | null) => {
      if (cancelled) return;
      setState(
        src ? { src, status: "resolved" } : { src: null, status: "missing" },
      );
    };

    let result: string | null | Promise<string | null>;
    try {
      result = resolver(trimmed);
    } catch {
      setState({ src: null, status: "missing" });
      return;
    }

    if (result instanceof Promise) {
      setState({ src: null, status: "loading" });
      result.then(settle, () => settle(null));
    } else {
      settle(result);
    }

    return () => {
      cancelled = true;
    };
  }, [id, resolver]);

  return state;
}
