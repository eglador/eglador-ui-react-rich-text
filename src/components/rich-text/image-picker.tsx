"use client";

import { cn } from "../../lib/utils";
import { MediaThumb } from "./cms";
import { useMediaLibrary } from "./media-library-context";
import { useMessages } from "./i18n";

interface ImagePickerProps {
  /** Currently selected media ID, if any. */
  value: string;
  onSelect: (id: string) => void;
}

/**
 * Grid of the page's image library. Selecting a tile writes its ID —
 * the URL never enters the document.
 *
 * Items without a `url` fall back to `MediaThumb`, which resolves the ID
 * through `resolveImageSrc`, so a bare list of IDs renders previews too.
 */
export function ImagePicker({ value, onSelect }: ImagePickerProps) {
  const { items, status } = useMediaLibrary();
  const t = useMessages();

  if (status === "loading") {
    return (
      <p className="py-3 text-center text-xs text-zinc-400">
        {t.loadingImages}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-xs text-zinc-400">
        {t.noImagesAvailable}
      </p>
    );
  }

  return (
    <div className="max-h-44 overflow-y-auto rounded border border-zinc-200 p-1.5">
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(selected ? "" : item.id)}
              title={item.title ?? item.id}
              aria-pressed={selected}
              className={cn(
                "relative aspect-square cursor-pointer overflow-hidden rounded border transition-colors",
                selected
                  ? "border-blue-500 ring-2 ring-blue-500/30"
                  : "border-zinc-200 hover:border-zinc-400",
              )}
            >
              {item.url ? (
                <img
                  src={item.url}
                  alt={item.title ?? ""}
                  className="h-full w-full object-cover"
                />
              ) : (
                <MediaThumb id={item.id} alt={item.title ?? ""} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

ImagePicker.displayName = "ImagePicker";
