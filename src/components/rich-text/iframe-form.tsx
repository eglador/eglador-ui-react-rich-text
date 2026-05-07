"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { FrameIcon, TrashIcon } from "../../lib/icons";
import { Field, Toggle } from "./form-fields";
import type { IframeAspectRatio, IframeOptions } from "./iframe-node";

export interface IframeFormSubmit {
  src: string;
  options: IframeOptions;
}

export const IFRAME_DEFAULT_OPTIONS: Required<IframeOptions> = {
  title: "Embedded content",
  aspectRatio: "16:9",
  customHeight: 400,
  allowFullscreen: true,
};

interface IframeFormProps {
  mode: "insert" | "edit";
  initialSrc?: string;
  initialOptions?: Required<IframeOptions>;
  onSubmit: (data: IframeFormSubmit) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

/**
 * Unified iframe create / edit form. For embeds outside the dedicated
 * YouTube / Audio / Video flows.
 */
export function IframeForm({
  mode,
  initialSrc = "",
  initialOptions = IFRAME_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
  onRemove,
}: IframeFormProps) {
  const [src, setSrc] = React.useState(initialSrc);
  const [opts, setOpts] = React.useState<Required<IframeOptions>>(
    initialOptions,
  );
  const [error, setError] = React.useState<string | null>(null);

  const valid = src.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      setError("URL is required");
      return;
    }
    onSubmit({
      src: src.trim(),
      options: {
        title: opts.title.trim() || "Embedded content",
        aspectRatio: opts.aspectRatio,
        customHeight: Math.max(100, opts.customHeight || 400),
        allowFullscreen: opts.allowFullscreen,
      },
    });
  };

  const isCustom = opts.aspectRatio === "custom";

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <FrameIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? "Embed iframe" : "Iframe"}
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

      <Field label="URL">
        <input
          type="url"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={mode === "insert"}
          value={src}
          onChange={(e) => {
            setSrc(e.target.value);
            if (error) setError(null);
          }}
          placeholder="https://www.figma.com/embed?... or https://codepen.io/..."
          className={cn(
            "w-full px-2 py-1.5 text-sm border rounded outline-none",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          )}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </Field>

      <Field label="Title (a11y)">
        <input
          type="text"
          value={opts.title}
          onChange={(e) => setOpts((s) => ({ ...s, title: e.target.value }))}
          placeholder="Read by screen readers"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="Size">
        <select
          value={opts.aspectRatio}
          onChange={(e) =>
            setOpts((s) => ({
              ...s,
              aspectRatio: e.target.value as IframeAspectRatio,
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

      {isCustom && (
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

      <Field label="Permissions">
        <Toggle
          label="Allow fullscreen"
          checked={opts.allowFullscreen}
          onChange={(v) => setOpts((s) => ({ ...s, allowFullscreen: v }))}
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

IframeForm.displayName = "IframeForm";
