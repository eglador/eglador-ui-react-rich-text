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

/** Rich card for `newsMoment` — date/time header, title, body excerpt,
 *  and a thumbnail strip built from the `images` ID list. */
export function NewsMomentPreview(fields: CmsFieldValues) {
  const ids = parseIdList(fields.images);
  const stamp = [fields.date, fields.time].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 border-b border-zinc-200">
        <span className="inline-block size-1.5 rounded-full bg-red-500 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          News moment
        </span>
        {stamp && (
          <span className="ml-auto text-[11px] font-mono tabular-nums text-zinc-500">
            {stamp}
          </span>
        )}
      </div>

      <div className="p-3">
        {fields.title && (
          <div className="text-sm font-semibold text-zinc-900 mb-1">
            {fields.title}
          </div>
        )}
        {fields.content && (
          <p className="text-xs text-zinc-600 line-clamp-3 whitespace-pre-wrap">
            {fields.content}
          </p>
        )}
        {ids.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ids.map((id) => (
              <div
                key={id}
                className="size-14 shrink-0 overflow-hidden rounded border border-zinc-200"
              >
                <MediaThumb id={id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
