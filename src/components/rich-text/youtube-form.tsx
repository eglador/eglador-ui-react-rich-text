"use client";

import * as React from "react";
import { useMessages } from "./i18n";
import { useHiddenFields } from "./hidden-fields-context";
import { cn } from "../../lib/utils";
import { TrashIcon, YouTubeIcon } from "../../lib/icons";
import { Field, Toggle } from "./form-fields";
import {
  parseYouTubeUrl,
  type YouTubeOptions,
} from "./youtube-node";

export interface YouTubeFormSubmit {
  /** The URL exactly as typed — stored verbatim on the node. */
  url: string;
  options: YouTubeOptions;
}

export const YOUTUBE_DEFAULT_OPTIONS: Required<YouTubeOptions> = {
  autoplay: false,
  mute: false,
  loop: false,
  controls: true,
  start: 0,
};

interface YouTubeFormProps {
  /** `"insert"` for new embeds, `"edit"` for changing an existing one. */
  mode: "insert" | "edit";
  /** Pre-filled URL (typically `https://www.youtube.com/watch?v=ID`) when editing. */
  initialUrl?: string;
  /** Current player options when editing. */
  initialOptions?: Required<YouTubeOptions>;
  /** Submitted on Embed/Save click with parsed video ID + final options. */
  onSubmit: (data: YouTubeFormSubmit) => void;
  /** Cancel — discards changes and closes the form. */
  onCancel: () => void;
  /** Remove — only shown in `"edit"` mode. */
  onRemove?: () => void;
}

/**
 * Unified YouTube create / edit form. Same fields render in both modes;
 * only the action buttons and header copy change. Inspired by Payload CMS,
 * which uses one form schema across the create and edit flows.
 */
export function YouTubeForm({
  mode,
  initialUrl = "",
  initialOptions = YOUTUBE_DEFAULT_OPTIONS,
  onSubmit,
  onCancel,
  onRemove,
}: YouTubeFormProps) {
  const t = useMessages();
  const isHidden = useHiddenFields("youtube");
  const [url, setUrl] = React.useState(initialUrl);
  // Merge over the defaults rather than trusting `initialOptions` to be
  // complete: a payload saved with `hiddenFields` (or by an older
  // version) can be missing keys, and the submit handler calls
  // `.trim()` on them.
  const [opts, setOpts] = React.useState<Required<YouTubeOptions>>(
    () => ({ ...YOUTUBE_DEFAULT_OPTIONS, ...initialOptions }),
  );
  const [error, setError] = React.useState<string | null>(null);
  const userTouchedStart = React.useRef(mode === "edit");

  const match = parseYouTubeUrl(url);
  // Any non-empty URL is accepted: authors paste ready-made embed URLs,
  // which may point at a custom host or carry their own params. A URL we
  // can't recognise only costs the auto-filled start time and a hint.
  const valid = url.trim().length > 0;
  const looksLikeYouTube = match !== null;

  // Auto-populate `start` from `?t=` in URL — only in insert mode and
  // only if the user hasn't manually set it yet.
  React.useEffect(() => {
    if (
      mode === "insert" &&
      !userTouchedStart.current &&
      match?.start !== undefined
    ) {
      setOpts((s) => ({ ...s, start: match.start! }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.start, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!url.trim()) {
      setError(t.urlRequired);
      return;
    }
    onSubmit({
      url: url.trim(),
      options: {
        autoplay: opts.autoplay,
        // Autoplay requires mute in modern browsers.
        mute: opts.autoplay || opts.mute,
        loop: opts.loop,
        controls: opts.controls,
        start: opts.start || 0,
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <YouTubeIcon className="size-3.5 text-zinc-700" />
          {mode === "insert" ? "Embed YouTube" : "YouTube"}
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

      {!isHidden("url") && (
        <Field label={t.url}>
          <input
            type="url"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={mode === "insert"}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="https://youtube.com/watch?v=..."
            className={cn(
              "w-full px-2 py-1.5 text-sm border rounded outline-none",
              error
                ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-zinc-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            )}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          {!error && url.trim() && !looksLikeYouTube && (
            <p className="mt-1 text-xs text-amber-600">
              Bu bir YouTube adresine benzemiyor — yine de olduğu gibi
              kaydedilecek.
            </p>
          )}
          <p className="mt-1 text-[10px] text-zinc-500">
            Girdiğin adres JSON’a birebir yazılır.
          </p>
        </Field>
      )}

      {!isHidden("playerOptions") && (
        <Field label={t.playerOptions}>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <Toggle
              label={t.autoplay}
              checked={opts.autoplay}
              onChange={(v) =>
                setOpts((s) => ({
                  ...s,
                  autoplay: v,
                  mute: v ? true : s.mute,
                }))
              }
            />
            <Toggle
              label={t.mute}
              checked={opts.mute}
              disabled={opts.autoplay}
              hint={opts.autoplay ? t.requiredByAutoplay : undefined}
              onChange={(v) => setOpts((s) => ({ ...s, mute: v }))}
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
      )}

      {!isHidden("start") && (
        <Field label={t.startAt}>
          <div className="inline-flex items-center gap-2">
            <input
              type="number"
              min={0}
              step={1}
              value={opts.start || ""}
              onChange={(e) => {
                userTouchedStart.current = true;
                setOpts((s) => ({
                  ...s,
                  start: Math.max(0, parseInt(e.target.value, 10) || 0),
                }));
              }}
              placeholder="0"
              className="w-20 px-2 py-1 text-xs font-mono border border-zinc-300 rounded text-center outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-zinc-500">{t.seconds}</span>
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

YouTubeForm.displayName = "YouTubeForm";
