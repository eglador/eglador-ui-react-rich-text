"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import {
  MaximizeIcon,
  MonitorIcon,
  TabletIcon,
  SmartphoneIcon,
} from "../../lib/icons";
import { usePageSize, type PageSizeName } from "./page-size-context";

interface Preset {
  name: PageSizeName;
  label: string;
  width: number | null;
  Icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_PRESETS: Preset[] = [
  { name: "full", label: "Full width", width: null, Icon: MaximizeIcon },
  { name: "desktop", label: "Desktop", width: 1280, Icon: MonitorIcon },
  { name: "tablet", label: "Tablet", width: 768, Icon: TabletIcon },
  { name: "mobile", label: "Mobile", width: 375, Icon: SmartphoneIcon },
];

export interface RichTextPageSizeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Custom preset list (overrides defaults) */
  presets?: Preset[];
  /** Hide the custom width input */
  hideCustom?: boolean;
}

/**
 * Bottom-anchored device toolbar — DevTools-style. Place after
 * `<RichTextContent />` inside `<RichTextEditor>` and it visually attaches
 * to the editor's lower edge with a top border and subtle backdrop.
 *
 * Layout: pill button group (Full / Desktop / Tablet / Mobile) · live
 * dimensions readout (`1280 × auto`) · custom px input.
 */
export function RichTextPageSize({
  presets = DEFAULT_PRESETS,
  hideCustom = false,
  className,
  ...props
}: RichTextPageSizeProps) {
  const { size, setSize } = usePageSize();

  return (
    <div
      role="toolbar"
      aria-label="Page size"
      className={cn(
        "flex items-center justify-center gap-3 px-3 py-2 flex-wrap",
        "border-t border-zinc-200 bg-zinc-50/80 backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {/* Device pill group */}
      <div className="inline-flex items-center gap-0.5 rounded-md bg-zinc-200/60 p-0.5">
        {presets.map((preset) => {
          const active = size.name === preset.name;
          return (
            <button
              key={preset.name}
              type="button"
              onClick={() =>
                setSize({ name: preset.name, width: preset.width })
              }
              title={
                preset.width !== null
                  ? `${preset.label} — ${preset.width}px`
                  : preset.label
              }
              aria-label={preset.label}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center justify-center size-7 rounded transition-all cursor-pointer",
                active
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800",
              )}
            >
              <preset.Icon className="size-4" />
            </button>
          );
        })}
      </div>

      <div className="w-px h-5 bg-zinc-300" aria-hidden="true" />

      {/* Dimensions readout */}
      <div className="inline-flex items-center text-xs font-mono tabular-nums min-w-[110px] justify-center">
        {size.width !== null ? (
          <>
            <span className="font-medium text-zinc-900">{size.width}</span>
            <span className="text-zinc-400 mx-1.5">×</span>
            <span className="text-zinc-500">auto</span>
          </>
        ) : (
          <span className="text-zinc-500">Full width</span>
        )}
      </div>

      {!hideCustom && (
        <>
          <div className="w-px h-5 bg-zinc-300" aria-hidden="true" />
          <input
            type="number"
            min={200}
            max={4000}
            step={1}
            placeholder="custom"
            value={
              size.name === "custom" && size.width !== null
                ? size.width
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setSize({ name: "full", width: null });
                return;
              }
              const w = parseInt(v, 10);
              if (Number.isFinite(w) && w > 0) {
                setSize({ name: "custom", width: w });
              }
            }}
            aria-label="Custom width in pixels"
            className="w-20 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </>
      )}
    </div>
  );
}

RichTextPageSize.displayName = "RichTextPageSize";
