"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ImageIcon, TrashIcon } from "../../lib/icons";
import { Field } from "./form-fields";
import type { ImageOptions } from "./image-node";

export interface ImageFormSubmit {
  src: string;
  options: ImageOptions;
}

export const IMAGE_DEFAULT_OPTIONS: Required<ImageOptions> = {
  alt: "",
  caption: "",
  maxWidth: 0,
};

interface ImageFormProps {
  mode: "insert" | "edit";
  initialSrc?: string;
  initialOptions?: Required<ImageOptions>;
  onSubmit: (data: ImageFormSubmit) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

/**
 * Unified image create / edit form. Handles all browser-native formats
 * (.jpg, .png, .webp, .avif, .svg, .gif).
 */
export function ImageForm({
  mode,
  initialSrc = "",
  initialOptions = IMAGE_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
  onRemove,
}: ImageFormProps) {
  const [src, setSrc] = React.useState(initialSrc);
  const [opts, setOpts] = React.useState<Required<ImageOptions>>(
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
        alt: opts.alt.trim(),
        caption: opts.caption.trim(),
        maxWidth: opts.maxWidth || 0,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <ImageIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? "Embed image" : "Image"}
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
          placeholder="https://cdn.example.com/image.jpg"
          className={cn(
            "w-full px-2 py-1.5 text-sm border rounded outline-none",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          )}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </Field>

      <Field label="Alt text">
        <input
          type="text"
          value={opts.alt}
          onChange={(e) => setOpts((s) => ({ ...s, alt: e.target.value }))}
          placeholder="Describe the image for screen readers"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="Caption (optional)">
        <input
          type="text"
          value={opts.caption}
          onChange={(e) =>
            setOpts((s) => ({ ...s, caption: e.target.value }))
          }
          placeholder="Shown below the image"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="Max width">
        <div className="inline-flex items-center gap-2">
          <input
            type="number"
            min={0}
            step={10}
            value={opts.maxWidth || ""}
            onChange={(e) =>
              setOpts((s) => ({
                ...s,
                maxWidth: Math.max(0, parseInt(e.target.value, 10) || 0),
              }))
            }
            placeholder="auto"
            className="w-20 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-xs text-zinc-500">
            px ({opts.maxWidth ? "fixed" : "responsive / natural"})
          </span>
        </div>
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

ImageForm.displayName = "ImageForm";
