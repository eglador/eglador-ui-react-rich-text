"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { cn } from "../../lib/utils";

export interface RichTextStatsValue {
  /** Total characters including whitespace. */
  characters: number;
  /** Total characters excluding whitespace. */
  charactersNoSpaces: number;
  /** Word count (whitespace-separated, non-empty tokens). */
  words: number;
  /** Estimated reading time in minutes (rounded up, 200 wpm). */
  readingMinutes: number;
}

export interface RichTextStatsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Show word count (default `true`) */
  showWords?: boolean;
  /** Show character count (default `true`) */
  showCharacters?: boolean;
  /** Show estimated reading time (default `false`) */
  showReadingTime?: boolean;
  /** Exclude whitespace when counting characters (default `false`) */
  excludeSpaces?: boolean;
  /** Words per minute used for reading time estimate (default `200`) */
  wordsPerMinute?: number;
  /** Custom render — receives live stats, returns ReactNode. Overrides
   *  the default segmented label rendering when provided. */
  children?: (stats: RichTextStatsValue) => React.ReactNode;
}

function computeStats(text: string, wpm: number): RichTextStatsValue {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const trimmed = text.trim();
  const words = trimmed === "" ? 0 : trimmed.split(/\s+/).length;
  const readingMinutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / wpm));
  return { characters, charactersNoSpaces, words, readingMinutes };
}

/**
 * Live document statistics — words, characters, optional reading time.
 * Reads the root text content on every editor update and re-renders.
 *
 * Render inside `<RichTextEditor>` to enable, like other plugin
 * composables (page-size, slash, auto-embed):
 *
 * ```tsx
 * <RichTextEditor>
 *   <RichTextToolbar />
 *   <RichTextContent />
 *   <RichTextStats showReadingTime />
 * </RichTextEditor>
 * ```
 */
export function RichTextStats({
  showWords = true,
  showCharacters = true,
  showReadingTime = false,
  excludeSpaces = false,
  wordsPerMinute = 200,
  className,
  children,
  ...props
}: RichTextStatsProps) {
  const [editor] = useLexicalComposerContext();
  const [stats, setStats] = React.useState<RichTextStatsValue>({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    readingMinutes: 0,
  });

  React.useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const text = $getRoot().getTextContent();
        setStats(computeStats(text, wordsPerMinute));
      });
    };
    update();
    return editor.registerUpdateListener(update);
  }, [editor, wordsPerMinute]);

  if (children) {
    return (
      <div className={className} {...props}>
        {children(stats)}
      </div>
    );
  }

  const charValue = excludeSpaces
    ? stats.charactersNoSpaces
    : stats.characters;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Document statistics"
      className={cn(
        "flex items-center justify-end gap-3 px-3 py-1.5 text-xs text-zinc-500 border-t border-zinc-200 bg-zinc-50 tabular-nums",
        className,
      )}
      {...props}
    >
      {showWords && (
        <span>
          <span className="text-zinc-400">Words:</span>{" "}
          <span className="font-medium text-zinc-700">{stats.words}</span>
        </span>
      )}
      {showCharacters && (
        <span>
          <span className="text-zinc-400">Characters:</span>{" "}
          <span className="font-medium text-zinc-700">{charValue}</span>
        </span>
      )}
      {showReadingTime && stats.words > 0 && (
        <span>
          <span className="text-zinc-400">Reading:</span>{" "}
          <span className="font-medium text-zinc-700">
            {stats.readingMinutes} min
          </span>
        </span>
      )}
    </div>
  );
}

RichTextStats.displayName = "RichTextStats";
