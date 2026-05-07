"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { SplitViewIcon, TrashIcon } from "../../lib/icons";
import { Field, Toggle } from "./form-fields";
import type {
  ComparisonAspectRatio,
  ComparisonOrientation,
  ImageComparisonOptions,
} from "./image-comparison-node";

export interface ImageComparisonFormSubmit {
  beforeSrc: string;
  afterSrc: string;
  options: ImageComparisonOptions;
}

export const IMAGE_COMPARISON_DEFAULT_OPTIONS: Required<ImageComparisonOptions> =
  {
    beforeAlt: "",
    afterAlt: "",
    beforeLabel: "Before",
    afterLabel: "After",
    showLabels: true,
    orientation: "horizontal",
    initialPosition: 50,
    aspectRatio: "16:9",
    customHeight: 400,
  };

interface ImageComparisonFormProps {
  mode: "insert" | "edit";
  initialBeforeSrc?: string;
  initialAfterSrc?: string;
  initialOptions?: Required<ImageComparisonOptions>;
  onSubmit: (data: ImageComparisonFormSubmit) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

/**
 * Unified image comparison create / edit form. Two image URLs (before +
 * after) plus appearance options (orientation, aspect ratio, initial
 * divider position, labels).
 */
export function ImageComparisonForm({
  mode,
  initialBeforeSrc = "",
  initialAfterSrc = "",
  initialOptions = IMAGE_COMPARISON_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
  onRemove,
}: ImageComparisonFormProps) {
  const [beforeSrc, setBeforeSrc] = React.useState(initialBeforeSrc);
  const [afterSrc, setAfterSrc] = React.useState(initialAfterSrc);
  const [opts, setOpts] = React.useState<Required<ImageComparisonOptions>>(
    initialOptions,
  );
  const [error, setError] = React.useState<string | null>(null);

  const valid = beforeSrc.trim().length > 0 && afterSrc.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("Both Before and After URLs are required");
      return;
    }
    onSubmit({
      beforeSrc: beforeSrc.trim(),
      afterSrc: afterSrc.trim(),
      options: {
        beforeAlt: opts.beforeAlt.trim(),
        afterAlt: opts.afterAlt.trim(),
        beforeLabel: opts.beforeLabel.trim() || "Before",
        afterLabel: opts.afterLabel.trim() || "After",
        showLabels: opts.showLabels,
        orientation: opts.orientation,
        initialPosition: clamp(opts.initialPosition, 0, 100),
        aspectRatio: opts.aspectRatio,
        customHeight: Math.max(100, opts.customHeight || 400),
      },
    });
  };

  const isCustomAspect = opts.aspectRatio === "custom";

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <SplitViewIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? "Image comparison" : "Comparison"}
        </div>
        {mode === "edit" && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline cursor-pointer"
          >
            <TrashIcon className="size-3.5" />
            Delete
          </button>
        )}
      </div>

      <Field label="Before — URL">
        <input
          type="url"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={mode === "insert"}
          value={beforeSrc}
          onChange={(e) => {
            setBeforeSrc(e.target.value);
            if (error) setError(null);
          }}
          placeholder="https://cdn.example.com/before.jpg"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="Before — Alt text">
        <input
          type="text"
          value={opts.beforeAlt}
          onChange={(e) =>
            setOpts((s) => ({ ...s, beforeAlt: e.target.value }))
          }
          placeholder="Describe the original image"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="After — URL">
        <input
          type="url"
          value={afterSrc}
          onChange={(e) => {
            setAfterSrc(e.target.value);
            if (error) setError(null);
          }}
          placeholder="https://cdn.example.com/after.jpg"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="After — Alt text">
        <input
          type="text"
          value={opts.afterAlt}
          onChange={(e) =>
            setOpts((s) => ({ ...s, afterAlt: e.target.value }))
          }
          placeholder="Describe the modified image"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      {error && <p className="mt-1 mb-2 text-xs text-red-600">{error}</p>}

      <Field label="Orientation">
        <select
          value={opts.orientation}
          onChange={(e) =>
            setOpts((s) => ({
              ...s,
              orientation: e.target.value as ComparisonOrientation,
            }))
          }
          className="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="horizontal">Horizontal — left / right</option>
          <option value="vertical">Vertical — top / bottom</option>
        </select>
      </Field>

      <Field label="Aspect ratio">
        <select
          value={opts.aspectRatio}
          onChange={(e) =>
            setOpts((s) => ({
              ...s,
              aspectRatio: e.target.value as ComparisonAspectRatio,
            }))
          }
          className="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="16:9">16:9 — widescreen (default)</option>
          <option value="4:3">4:3 — classic</option>
          <option value="1:1">1:1 — square</option>
          <option value="9:16">9:16 — portrait / mobile</option>
          <option value="custom">Custom — fixed height in px</option>
        </select>
      </Field>

      {isCustomAspect && (
        <Field label="Height">
          <div className="inline-flex items-center gap-2">
            <input
              type="number"
              min={100}
              step={10}
              value={opts.customHeight || ""}
              onChange={(e) =>
                setOpts((s) => ({
                  ...s,
                  customHeight: Math.max(
                    100,
                    parseInt(e.target.value, 10) || 400,
                  ),
                }))
              }
              placeholder="400"
              className="w-24 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-500">px (min 100)</span>
          </div>
        </Field>
      )}

      <Field label="Initial position">
        <div className="inline-flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            step={5}
            value={opts.initialPosition}
            onChange={(e) =>
              setOpts((s) => ({
                ...s,
                initialPosition: clamp(
                  parseInt(e.target.value, 10) || 0,
                  0,
                  100,
                ),
              }))
            }
            className="w-20 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-zinc-500">%</span>
        </div>
      </Field>

      <Field label="Labels">
        <Toggle
          label="Show labels on the image"
          checked={opts.showLabels}
          onChange={(v) => setOpts((s) => ({ ...s, showLabels: v }))}
        />
        {opts.showLabels && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <input
              type="text"
              value={opts.beforeLabel}
              onChange={(e) =>
                setOpts((s) => ({ ...s, beforeLabel: e.target.value }))
              }
              placeholder="Before"
              className="px-2 py-1 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={opts.afterLabel}
              onChange={(e) =>
                setOpts((s) => ({ ...s, afterLabel: e.target.value }))
              }
              placeholder="After"
              className="px-2 py-1 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
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
          disabled={!valid}
          className={cn(
            "px-3 py-1.5 text-xs rounded text-white cursor-pointer",
            "bg-blue-600 hover:bg-blue-700",
            "disabled:bg-zinc-300 disabled:cursor-not-allowed",
          )}
        >
          {mode === "insert" ? "Embed" : "Save"}
        </button>
      </div>
    </form>
  );
}

ImageComparisonForm.displayName = "ImageComparisonForm";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
