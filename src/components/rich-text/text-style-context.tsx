"use client";

import * as React from "react";
import type { InlineTextStyleOptions } from "./text-styles";

/** `null` disables the derived `css` key; an object enables it. */
export type InlineTextStyleSetting = InlineTextStyleOptions | null;

/** Normalize the `inlineTextStyles` prop shape into a setting. */
export function resolveInlineTextStyles(
  value: boolean | InlineTextStyleOptions | undefined,
): InlineTextStyleSetting {
  if (value === false) return null;
  if (value === undefined || value === true) return {};
  return value;
}

// `undefined` distinguishes "no provider" from "explicitly disabled".
const TextStyleContext = React.createContext<
  InlineTextStyleSetting | undefined
>(undefined);

export function TextStyleProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: InlineTextStyleSetting;
}) {
  return (
    <TextStyleContext.Provider value={value}>
      {children}
    </TextStyleContext.Provider>
  );
}

/**
 * The active inline-text-style setting. Enabled by default — including
 * outside a provider — so `getJson()` and `onChange` carry the ready-to-use
 * `css` string unless an editor explicitly opts out with
 * `inlineTextStyles={false}`.
 */
export function useInlineTextStyles(): InlineTextStyleSetting {
  const ctx = React.useContext(TextStyleContext);
  return ctx === undefined ? {} : ctx;
}
