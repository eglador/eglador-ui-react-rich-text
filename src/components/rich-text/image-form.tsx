"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { ImageIcon, TrashIcon } from "../../lib/icons";
import { Field } from "./form-fields";
import { useResolvedSrc } from "./media-resolver-context";
import { useMediaLibrary } from "./media-library-context";
import { ImagePicker } from "./image-picker";
import { useMessages } from "./i18n";
import { useHiddenFields } from "./hidden-fields-context";
import type { ImageOptions } from "./image-node";

export interface ImageFormSubmit {
  src: string;
  options: ImageOptions;
}

export const IMAGE_DEFAULT_OPTIONS: Required<ImageOptions> = {
  alt: "",
  caption: "",
  maxWidth: 0,
  imageId: "",
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
  // Merge over the defaults rather than trusting `initialOptions` to be
  // complete: a payload saved with `hiddenFields` (or by an older
  // version) can be missing keys, and the submit handler calls
  // `.trim()` on them.
  const [opts, setOpts] = React.useState<Required<ImageOptions>>(
    () => ({ ...IMAGE_DEFAULT_OPTIONS, ...initialOptions }),
  );
  const [error, setError] = React.useState<string | null>(null);
  const t = useMessages();
  const isHidden = useHiddenFields("image");
  const { configured: hasLibrary } = useMediaLibrary();

  const imageId = opts.imageId.trim();
  const byId = imageId.length > 0;
  // An ID-addressed image doesn't need a URL — the host resolves it.
  const valid = byId || src.trim().length > 0;

  const resolved = useResolvedSrc(byId ? imageId : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!valid) {
      setError(t.idOrUrlRequired);
      return;
    }
    onSubmit({
      // Kept only as a transient preview when addressing by ID —
      // `ImageNode.exportJSON()` drops it in that case.
      src: byId ? (resolved.src ?? "") : src.trim(),
      options: {
        alt: opts.alt.trim(),
        caption: opts.caption.trim(),
        maxWidth: opts.maxWidth || 0,
        imageId,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <ImageIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? t.insertImage : t.imageBlock}
        </div>
        {mode === "edit" && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline cursor-pointer"
          >
            <TrashIcon className="size-3.5" />
            {t.delete}
          </button>
        )}
      </div>

      {hasLibrary && (
        <Field label={t.chooseImage}>
          <ImagePicker
            value={opts.imageId}
            onSelect={(id) => {
              setOpts((s) => ({ ...s, imageId: id }));
              if (error) setError(null);
            }}
          />
        </Field>
      )}

      {!isHidden("imageId") && (
        <Field label={t.imageId}>
          <input
            type="text"
            // With a library configured the ID comes from the picker, so
            // the field is a read-only readout rather than an input.
            readOnly={hasLibrary}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={mode === "insert" && !hasLibrary}
            value={opts.imageId}
            onChange={(e) => {
              setOpts((s) => ({ ...s, imageId: e.target.value }));
              if (error) setError(null);
            }}
            placeholder="345456"
            className={cn(
              "w-full px-2 py-1.5 text-sm border rounded outline-none",
              hasLibrary
                ? "border-zinc-200 bg-zinc-50 text-zinc-500"
                : error
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            )}
          />
          <p className="mt-1 text-[10px] text-zinc-500">
            {byId ? t.urlNotStoredHint : t.urlDisabledHint}
          </p>
        </Field>
      )}

      {!isHidden("url") && (
        <Field label={byId ? t.resolvedUrl : t.url}>
          <input
            type={byId || hasLibrary ? "text" : "url"}
            // The URL is derived, never authored, once images come from a
            // library — it isn't stored on the node either way.
            readOnly={byId || hasLibrary}
            value={byId ? (resolved.src ?? "") : src}
            onChange={(e) => {
              setSrc(e.target.value);
              if (error) setError(null);
            }}
            placeholder={
              byId
                ? resolved.status === "loading"
                  ? t.resolving
                  : t.notFoundForId
                : "https://cdn.example.com/image.jpg"
            }
            className={cn(
              "w-full px-2 py-1.5 text-sm border rounded outline-none",
              byId || hasLibrary
                ? "border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
                : error
                  ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            )}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </Field>
      )}

      {!isHidden("alt") && (
        <Field label={t.altText}>
          <input
            type="text"
            value={opts.alt}
            onChange={(e) => setOpts((s) => ({ ...s, alt: e.target.value }))}
            placeholder={t.altTextHint}
            className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
      )}

      {!isHidden("caption") && (
        <Field label={`${t.caption} (${t.optional})`}>
          <input
            type="text"
            value={opts.caption}
            onChange={(e) =>
              setOpts((s) => ({ ...s, caption: e.target.value }))
            }
            placeholder={t.captionHint}
            className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </Field>
      )}

      {!isHidden("maxWidth") && (
        <Field label={t.maxWidth}>
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
              placeholder={t.auto}
              className="w-20 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-500">
              px ({opts.maxWidth ? t.fixed : t.responsive})
            </span>
          </div>
        </Field>
      )}

      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          {t.cancel}
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
          {mode === "insert" ? t.embed : t.save}
        </button>
      </div>
    </form>
  );
}

ImageForm.displayName = "ImageForm";
