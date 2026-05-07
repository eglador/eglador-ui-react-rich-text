"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  AutoEmbedOption,
  LexicalAutoEmbedPlugin,
  type EmbedConfig,
  type EmbedMatchResult,
} from "@lexical/react/LexicalAutoEmbedPlugin";
import { $insertNodes, type LexicalEditor } from "lexical";
import { cn } from "../../lib/utils";
import { AudioLinesIcon, VideoIcon, YouTubeIcon } from "../../lib/icons";
import { $createYouTubeNode, parseYouTubeUrl } from "./youtube-node";
import { $createAudioNode, isAudioUrl } from "./audio-node";
import { $createVideoNode, isVideoUrl } from "./video-node";

/**
 * Application-level embed config — extends Lexical's `EmbedConfig` with
 * UI metadata (label, icon, keywords, example URL) used by our menu.
 */
interface AppEmbedConfig
  extends EmbedConfig<unknown, EmbedMatchResult<unknown>> {
  contentName: string;
  exampleUrl: string;
  icon: React.ReactNode;
  keywords: string[];
}

const YouTubeEmbedConfig: AppEmbedConfig = {
  type: "youtube-video",
  contentName: "YouTube Video",
  exampleUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
  icon: <YouTubeIcon className="size-4 text-zinc-700" />,
  keywords: ["youtube", "video"],
  parseUrl: (text) => {
    const match = parseYouTubeUrl(text);
    if (!match) return null;
    return { url: text, id: match.id, data: { start: match.start } };
  },
  insertNode: (editor: LexicalEditor, result) => {
    const data = result.data as { start?: number } | undefined;
    editor.update(() => {
      $insertNodes([
        $createYouTubeNode(result.id, {
          start: data?.start,
        }),
      ]);
    });
  },
};

const AudioEmbedConfig: AppEmbedConfig = {
  type: "audio-file",
  contentName: "Audio",
  exampleUrl: "https://cdn.example.com/audio.mp3",
  icon: <AudioLinesIcon className="size-4 text-zinc-700" />,
  keywords: ["audio", "mp3", "podcast", "sound"],
  parseUrl: (text) => {
    if (!isAudioUrl(text)) return null;
    return { url: text, id: text };
  },
  insertNode: (editor: LexicalEditor, result) => {
    editor.update(() => {
      $insertNodes([$createAudioNode(result.url)]);
    });
  },
};

const VideoEmbedConfig: AppEmbedConfig = {
  type: "video-file",
  contentName: "Video",
  exampleUrl: "https://cdn.example.com/video.mp4",
  icon: <VideoIcon className="size-4 text-zinc-700" />,
  keywords: ["video", "mp4", "clip"],
  parseUrl: (text) => {
    if (!isVideoUrl(text)) return null;
    return { url: text, id: text };
  },
  insertNode: (editor: LexicalEditor, result) => {
    editor.update(() => {
      $insertNodes([$createVideoNode(result.url)]);
    });
  },
};

const EMBED_CONFIGS: AppEmbedConfig[] = [
  YouTubeEmbedConfig,
  AudioEmbedConfig,
  VideoEmbedConfig,
];

/**
 * Auto-embed plugin — when a user pastes (or types) a recognized URL
 * (YouTube), a small inline menu offers to convert it into an embed
 * block. Built on Lexical's `LexicalAutoEmbedPlugin`.
 *
 * Opt-in component:
 *
 * ```tsx
 * <RichTextEditor>
 *   <RichTextContent />
 *   <RichTextAutoEmbed />
 * </RichTextEditor>
 * ```
 */
export function RichTextAutoEmbed() {
  const activeConfigRef = React.useRef<AppEmbedConfig | null>(null);

  return (
    <LexicalAutoEmbedPlugin<AppEmbedConfig>
      embedConfigs={EMBED_CONFIGS}
      onOpenEmbedModalForConfig={() => {}}
      getMenuOptions={(active, embedFn, dismissFn) => {
        // Track which config matched so menuRenderFn can show its icon/name.
        activeConfigRef.current = active;
        return [
          new AutoEmbedOption(`Embed ${active.contentName}`, {
            onSelect: embedFn,
          }),
          new AutoEmbedOption("Dismiss", { onSelect: dismissFn }),
        ];
      }}
      menuRenderFn={(anchorElementRef, itemProps) => {
        const {
          options,
          selectedIndex,
          selectOptionAndCleanUp,
          setHighlightedIndex,
        } = itemProps;
        const activeConfig = activeConfigRef.current;
        if (!anchorElementRef.current || options.length === 0 || !activeConfig)
          return null;

        return createPortal(
          <div
            role="menu"
            aria-label="Auto embed"
            className="absolute z-[9999] w-72 rounded-lg border border-zinc-200 bg-white shadow-xl p-1"
          >
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-zinc-100 mb-1">
              <span className="inline-flex items-center justify-center size-6 rounded bg-zinc-100 text-zinc-700 shrink-0">
                {activeConfig.icon}
              </span>
              <span className="text-xs font-medium text-zinc-700">
                {activeConfig.contentName} detected
              </span>
            </div>
            {options.map((option, i) => {
              const isDismiss = option.title === "Dismiss";
              return (
                <button
                  key={option.key}
                  type="button"
                  role="menuitem"
                  ref={option.setRefElement}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={cn(
                    "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm cursor-pointer",
                    selectedIndex === i
                      ? isDismiss
                        ? "bg-zinc-100 text-zinc-700"
                        : "bg-blue-50 text-blue-700"
                      : isDismiss
                        ? "text-zinc-600 hover:bg-zinc-50"
                        : "text-zinc-800 hover:bg-blue-50",
                  )}
                >
                  <span className="flex-1 text-left font-medium">
                    {option.title}
                  </span>
                  {selectedIndex === i && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      ↵
                    </span>
                  )}
                </button>
              );
            })}
          </div>,
          anchorElementRef.current,
        );
      }}
    />
  );
}

RichTextAutoEmbed.displayName = "RichTextAutoEmbed";
