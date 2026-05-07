"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Columns3Icon } from "../../lib/icons";
import { Field, Toggle } from "./form-fields";
import {
  COLUMNS_MAX,
  COLUMNS_MIN,
  type ColumnsGap,
} from "./columns-node";

export interface ColumnsFormSubmit {
  count: number;
  gap: ColumnsGap;
  mobileStack: boolean;
}

export const COLUMNS_DEFAULT_OPTIONS: ColumnsFormSubmit = {
  count: 2,
  gap: "medium",
  mobileStack: true,
};

interface ColumnsFormProps {
  initialOptions?: ColumnsFormSubmit;
  onSubmit: (data: ColumnsFormSubmit) => void;
  onCancel: () => void;
}

/**
 * Insert form for the columns layout. Edit-time tweaks happen via the
 * floating `RichTextColumnsToolbar` (count, gap, mobile stack).
 */
export function ColumnsForm({
  initialOptions = COLUMNS_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
}: ColumnsFormProps) {
  const [count, setCount] = React.useState(initialOptions.count);
  const [gap, setGap] = React.useState<ColumnsGap>(initialOptions.gap);
  const [mobileStack, setMobileStack] = React.useState(
    initialOptions.mobileStack,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ count, gap, mobileStack });
  };

  const counts = Array.from(
    { length: COLUMNS_MAX - COLUMNS_MIN + 1 },
    (_, i) => COLUMNS_MIN + i,
  );

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <Columns3Icon className="size-3.5 text-zinc-700" />
          Columns layout
        </div>
      </div>

      <Field label="Columns">
        <div className="grid grid-cols-5 gap-1">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              aria-pressed={count === n}
              className={cn(
                "py-2 text-xs font-medium border rounded transition-colors cursor-pointer",
                count === n
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Gap">
        <select
          value={gap}
          onChange={(e) => setGap(e.target.value as ColumnsGap)}
          className="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="small">Small</option>
          <option value="medium">Medium (default)</option>
          <option value="large">Large</option>
        </select>
      </Field>

      <Field label="Responsive">
        <Toggle
          label="Stack on mobile (< 768px)"
          checked={mobileStack}
          onChange={setMobileStack}
        />
      </Field>

      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs rounded text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
        >
          Insert
        </button>
      </div>
    </form>
  );
}

ColumnsForm.displayName = "ColumnsForm";
