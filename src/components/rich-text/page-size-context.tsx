"use client";

import * as React from "react";

export type PageSizeName =
  | "full"
  | "desktop"
  | "tablet"
  | "mobile"
  | "custom";

export interface PageSize {
  name: PageSizeName;
  /** Width constraint in px; `null` means no constraint (full width) */
  width: number | null;
}

interface PageSizeContextValue {
  size: PageSize;
  setSize: (size: PageSize) => void;
}

const FULL_SIZE: PageSize = { name: "full", width: null };

const PageSizeContext = React.createContext<PageSizeContextValue | null>(null);

interface PageSizeProviderProps {
  children: React.ReactNode;
  /** Initial size (default `{ name: "full", width: null }`) */
  initial?: PageSize;
}

/**
 * Shares the active page-size between `RichTextPageSize` (control) and
 * `RichTextContent` (consumer). Provided automatically by `RichTextEditor`.
 */
export function PageSizeProvider({
  children,
  initial = FULL_SIZE,
}: PageSizeProviderProps) {
  const [size, setSize] = React.useState<PageSize>(initial);
  const value = React.useMemo(() => ({ size, setSize }), [size]);
  return (
    <PageSizeContext.Provider value={value}>
      {children}
    </PageSizeContext.Provider>
  );
}

/**
 * Read/write the active page size. Falls back to a no-op when no
 * provider is mounted, so consumers render harmlessly outside an editor.
 */
export function usePageSize(): PageSizeContextValue {
  const ctx = React.useContext(PageSizeContext);
  if (!ctx) {
    return { size: FULL_SIZE, setSize: () => {} };
  }
  return ctx;
}
