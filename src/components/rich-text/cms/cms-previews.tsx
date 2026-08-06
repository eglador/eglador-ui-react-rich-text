"use client";

import { cn } from "../../../lib/utils";
import { ImageIcon } from "../../../lib/icons";
import { useResolvedSrc } from "../media-resolver-context";
import type { CmsFieldValues } from "./cms-types";

/** Split an `image-ids` field value into individual IDs. */
export function parseIdList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

interface MediaThumbProps {
  id: string;
  alt?: string;
  className?: string;
}

/**
 * A single media ID rendered through the host's resolver. Shows a
 * skeleton while an async resolver is in flight and a labeled
 * placeholder when the ID can't be resolved — never a broken image.
 */
export function MediaThumb({ id, alt = "", className }: MediaThumbProps) {
  const { src, status } = useResolvedSrc(id);

  if (status === "resolved" && src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("object-cover w-full h-full", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-full h-full bg-zinc-100 text-zinc-400",
        status === "loading" && "animate-pulse",
        className,
      )}
    >
      <ImageIcon className="size-5" />
      <span className="text-[10px] font-mono leading-none">
        {status === "loading" ? "…" : `#${id}`}
      </span>
    </div>
  );
}

/** Single-ID preview sized as a block-level image. */
export function SingleMediaPreview(idField: string) {
  return function Preview(fields: CmsFieldValues) {
    const id = fields[idField]?.trim();
    if (!id) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-zinc-200">
        <MediaThumb id={id} />
      </div>
    );
  };
}

/** Direct-URL preview for types that store a full image URL. */
export function UrlImagePreview(urlField: string) {
  return function Preview(fields: CmsFieldValues) {
    const url = fields[urlField]?.trim();
    if (!url) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        <img src={url} alt="" className="object-cover w-full h-full" />
      </div>
    );
  };
}

/** Pull-quote preview. `position` shifts the block the way the CMS
 *  floats it in the article, so the editor matches the published look. */
export function QuotePreview(fields: CmsFieldValues) {
  const alignRight = fields.position === "right";
  return (
    <blockquote
      className={cn(
        "max-w-md border-zinc-300 py-1 text-lg italic leading-snug text-zinc-700",
        alignRight
          ? "ml-auto border-r-4 pr-4 text-right"
          : "mr-auto border-l-4 pl-4",
      )}
    >
      {fields.text || (
        <span className="text-base not-italic text-zinc-400">
          Alıntı metni girilmedi
        </span>
      )}
    </blockquote>
  );
}

/** Image-backed pull quote: the artwork with the quote laid over it. */
export function ImageQuotePreview(fields: CmsFieldValues) {
  const url = fields.url?.trim();
  return (
    <figure className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
      {url && (
        <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <figcaption className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-black/25 to-transparent p-4">
        <blockquote className="text-lg italic leading-snug text-white drop-shadow">
          {fields.text || (
            <span className="text-base not-italic text-white/70">
              Alıntı metni girilmedi
            </span>
          )}
        </blockquote>
      </figcaption>
    </figure>
  );
}

const LINK_COLOR_CLASS: Record<string, string> = {
  kirmizi: "border-red-500 bg-red-50 text-red-700",
  mavi: "border-blue-500 bg-blue-50 text-blue-700",
  yesil: "border-emerald-500 bg-emerald-50 text-emerald-700",
};

/** Coloured call-to-action link (`sabitlink`). */
export function FixedLinkPreview(fields: CmsFieldValues) {
  const tone = LINK_COLOR_CLASS[fields.color] ?? LINK_COLOR_CLASS.mavi;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border-l-4 px-3 py-2.5 pr-12",
        tone,
      )}
    >
      <span className="truncate text-sm font-medium">
        {fields.text || "Bağlantı metni girilmedi"}
      </span>
      <span className="ml-auto truncate font-mono text-[11px] opacity-70">
        {fields.url}
      </span>
    </div>
  );
}
