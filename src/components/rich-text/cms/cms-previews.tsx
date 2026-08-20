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

/**
 * Card for social / media embeds. The real embed needs the platform's
 * own script, which the editor deliberately doesn't load — so this shows
 * the platform and the target URL instead of a broken frame.
 */
export function EmbedLinkPreview(
  label: string,
  tone: string,
  urlField = "url",
) {
  return function Preview(fields: CmsFieldValues) {
    const url = fields[urlField]?.trim();
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 pr-12",
          tone,
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider shrink-0">
          {label}
        </span>
        <span className="truncate font-mono text-[11px] opacity-80">
          {url || "URL girilmedi"}
        </span>
        {fields.position && (
          <span className="ml-auto shrink-0 text-[10px] opacity-60">
            {fields.position}
          </span>
        )}
      </div>
    );
  };
}

/** Titled pull quote (`quato2`) — a heading over an explanatory body. */
export function TitledQuotePreview(fields: CmsFieldValues) {
  return (
    <blockquote className="max-w-xl border-l-4 border-zinc-300 py-1 pl-4 pr-12">
      <div className="text-base font-semibold text-zinc-900">
        {fields.title || (
          <span className="font-normal text-zinc-400">Başlık girilmedi</span>
        )}
      </div>
      {fields.description && (
        <p className="mt-1 whitespace-pre-wrap text-sm italic leading-snug text-zinc-700">
          {fields.description}
        </p>
      )}
    </blockquote>
  );
}
