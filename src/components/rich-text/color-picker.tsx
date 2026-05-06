"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import {
  $patchStyleText,
  $getSelectionStyleValueForProperty,
} from "@lexical/selection";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { BanIcon } from "../../lib/icons";

export interface ColorPreset {
  value: string;
  label: string;
}

export const TEXT_COLOR_PRESETS: ColorPreset[] = [
  { value: "#000000", label: "Black" },
  { value: "#52525b", label: "Gray" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
];

export const BG_COLOR_PRESETS: ColorPreset[] = [
  { value: "#fef08a", label: "Yellow" },
  { value: "#fecaca", label: "Red" },
  { value: "#fed7aa", label: "Orange" },
  { value: "#bbf7d0", label: "Green" },
  { value: "#a5f3fc", label: "Cyan" },
  { value: "#bfdbfe", label: "Blue" },
  { value: "#ddd6fe", label: "Purple" },
  { value: "#fbcfe8", label: "Pink" },
  { value: "#e4e4e7", label: "Gray" },
];

interface ColorPickerProps {
  label: string;
  icon: React.ReactNode;
  property: "color" | "background-color";
  presets: ColorPreset[];
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
}

export function ColorPicker({
  label,
  icon,
  property,
  presets,
  sizeClass = "size-8",
}: ColorPickerProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState("");

  // Read the active value when the dropdown opens (so the swatch ring reflects it).
  React.useEffect(() => {
    if (!open) return;
    editor.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const value = $getSelectionStyleValueForProperty(
          selection,
          property,
          "",
        );
        setCurrentValue(value);
      }
    });
  }, [open, editor, property]);

  const apply = React.useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, { [property]: value || null });
        }
      });
      setOpen(false);
    },
    [editor, property],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      preserveSelection
      trigger={
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          title={label}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-center rounded transition-colors cursor-pointer",
            sizeClass,
            "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
            open && "bg-zinc-200 text-zinc-900",
          )}
        >
          {icon}
        </button>
      }
      contentClassName="w-56 rounded-lg border border-zinc-200 bg-white shadow-lg p-2"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => apply("")}
        className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm text-zinc-700 hover:bg-zinc-100 cursor-pointer"
      >
        <BanIcon className="size-4 text-zinc-500" />
        Default
      </button>
      <div className="mt-1.5 grid grid-cols-5 gap-1.5 px-1 pb-1">
        {presets.map((preset) => {
          const isActive =
            currentValue.toLowerCase() === preset.value.toLowerCase();
          return (
            <button
              key={preset.value}
              type="button"
              role="menuitem"
              onClick={() => apply(preset.value)}
              title={preset.label}
              aria-label={preset.label}
              className={cn(
                "size-7 rounded border border-zinc-200 hover:scale-110 transition-transform cursor-pointer",
                isActive && "ring-2 ring-blue-500 ring-offset-1",
              )}
              style={{ backgroundColor: preset.value }}
            />
          );
        })}
      </div>
    </Popover>
  );
}

ColorPicker.displayName = "ColorPicker";
