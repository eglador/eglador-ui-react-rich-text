"use client";

import * as React from "react";
import { useMessages } from "./i18n";
import { cn } from "../../lib/utils";
import { TrashIcon, VideoIcon } from "../../lib/icons";
import { Field, Toggle } from "./form-fields";
import { useResolvedSrc } from "./media-resolver-context";
import type {
  VideoAspectRatio,
  VideoOptions,
  VideoPreload,
} from "./video-node";

export interface VideoFormSubmit {
  src: string;
  options: VideoOptions;
}

export const VIDEO_DEFAULT_OPTIONS: Required<VideoOptions> = {
  title: "",
  poster: "",
  aspectRatio: "16:9",
  autoplay: false,
  loop: false,
  muted: false,
  controls: true,
  preload: "metadata",
  videoId: "",
};

interface VideoFormProps {
  mode: "insert" | "edit";
  initialSrc?: string;
  initialOptions?: Required<VideoOptions>;
  onSubmit: (data: VideoFormSubmit) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

/**
 * Unified video create / edit form. Same fields render in both modes;
 * only action buttons and Delete visibility change.
 */
export function VideoForm({
  mode,
  initialSrc = "",
  initialOptions = VIDEO_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
  onRemove,
}: VideoFormProps) {
  const t = useMessages();
  const [src, setSrc] = React.useState(initialSrc);
  const [opts, setOpts] = React.useState<Required<VideoOptions>>(
    initialOptions,
  );
  const [error, setError] = React.useState<string | null>(null);

  const videoId = opts.videoId.trim();
  const byId = videoId.length > 0;
  // An ID-addressed video doesn't need a URL — the host resolves it.
  const valid = byId || src.trim().length > 0;

  const resolved = useResolvedSrc(byId ? videoId : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!valid) {
      setError(t.idOrUrlRequired);
      return;
    }
    onSubmit({
      // Transient preview only when addressing by ID —
      // `VideoNode.exportJSON()` drops it in that case.
      src: byId ? (resolved.src ?? "") : src.trim(),
      options: {
        videoId,
        title: opts.title.trim(),
        poster: opts.poster.trim(),
        aspectRatio: opts.aspectRatio,
        autoplay: opts.autoplay,
        // Autoplay requires muted in modern browsers.
        muted: opts.autoplay || opts.muted,
        loop: opts.loop,
        controls: opts.controls,
        preload: opts.preload,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <VideoIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? "Embed video" : "Video"}
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

      <Field label={t.videoId}>
        <input
          type="text"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={mode === "insert"}
          value={opts.videoId}
          onChange={(e) => {
            setOpts((s) => ({ ...s, videoId: e.target.value }));
            if (error) setError(null);
          }}
          placeholder="913597"
          className={cn(
            "w-full px-2 py-1.5 text-sm border rounded outline-none",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          )}
        />
        <p className="mt-1 text-[10px] text-zinc-500">
          {byId
            ? t.urlNotStoredHint
            : t.urlDisabledHint}
        </p>
      </Field>

      <Field label={byId ? t.resolvedUrl : t.url}>
        <input
          type={byId ? "text" : "url"}
          readOnly={byId}
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
              : "https://cdn.example.com/video.mp4"
          }
          className={cn(
            "w-full px-2 py-1.5 text-sm border rounded outline-none",
            byId
              ? "border-zinc-200 bg-zinc-50 text-zinc-500 cursor-not-allowed"
              : error
                ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          )}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </Field>

      <Field label={`${t.poster} (${t.optional})`}>
        <input
          type="url"
          value={opts.poster}
          onChange={(e) => setOpts((s) => ({ ...s, poster: e.target.value }))}
          placeholder="https://cdn.example.com/thumbnail.jpg"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label={t.aspectRatio}>
        <select
          value={opts.aspectRatio}
          onChange={(e) =>
            setOpts((s) => ({
              ...s,
              aspectRatio: e.target.value as VideoAspectRatio,
            }))
          }
          className="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="16:9">16:9 — widescreen (default)</option>
          <option value="4:3">4:3 — classic</option>
          <option value="1:1">1:1 — square</option>
          <option value="9:16">9:16 — portrait / mobile</option>
        </select>
      </Field>

      <Field label={t.playerOptions}>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Toggle
            label={t.autoplay}
            checked={opts.autoplay}
            onChange={(v) =>
              setOpts((s) => ({
                ...s,
                autoplay: v,
                muted: v ? true : s.muted,
              }))
            }
          />
          <Toggle
            label={t.mute}
            checked={opts.muted}
            disabled={opts.autoplay}
            hint={opts.autoplay ? t.requiredByAutoplay : undefined}
            onChange={(v) => setOpts((s) => ({ ...s, muted: v }))}
          />
          <Toggle
            label={t.loop}
            checked={opts.loop}
            onChange={(v) => setOpts((s) => ({ ...s, loop: v }))}
          />
          <Toggle
            label={t.showControls}
            checked={opts.controls}
            onChange={(v) => setOpts((s) => ({ ...s, controls: v }))}
          />
        </div>
      </Field>

      <Field label={t.preload}>
        <select
          value={opts.preload}
          onChange={(e) =>
            setOpts((s) => ({ ...s, preload: e.target.value as VideoPreload }))
          }
          className="w-full px-2 py-1.5 text-xs border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="none">None — load on play</option>
          <option value="metadata">Metadata — duration only (default)</option>
          <option value="auto">Auto — full file</option>
        </select>
      </Field>

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

VideoForm.displayName = "VideoForm";
