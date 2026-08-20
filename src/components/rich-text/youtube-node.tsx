"use client";

import * as React from "react";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  type EditorConfig,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { SettingsIcon } from "../../lib/icons";
import { YouTubeForm } from "./youtube-form";

export interface YouTubeOptions {
  /** Auto-start the video on load (browsers require `mute` for this to work). */
  autoplay?: boolean;
  /** Start the video muted. Required by browsers when `autoplay` is on. */
  mute?: boolean;
  /** Loop the video. YouTube requires the `playlist` param to be set to
   *  the same video ID — handled automatically. */
  loop?: boolean;
  /** Show YouTube's player controls (default `true`). */
  controls?: boolean;
  /** Start position in seconds (`0` = beginning). */
  start?: number;
}

const DEFAULT_OPTIONS: Required<YouTubeOptions> = {
  autoplay: false,
  mute: false,
  loop: false,
  controls: true,
  start: 0,
};

export type SerializedYouTubeNode = Spread<
  {
    /** The URL exactly as the author entered it. */
    url?: string;
    /**
     * Legacy: documents written before the node stored URLs kept only
     * the 11-character video ID. Still read on import, never written.
     */
    videoID?: string;
    options?: YouTubeOptions;
  },
  SerializedDecoratorBlockNode
>;

/** Build the canonical privacy-friendly embed URL for a bare video ID. */
export function youTubeEmbedUrl(videoID: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoID}`;
}

/**
 * The URL to actually put in the iframe.
 *
 * The stored URL is whatever the author typed; a `watch?v=` or
 * `youtu.be` link can't be framed (YouTube refuses with
 * `X-Frame-Options`), so those are normalized to their `/embed/` form
 * for rendering only — the document keeps the original string.
 */
export function toYouTubeEmbedSrc(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/\/embed\//.test(trimmed)) return trimmed;
  const match = parseYouTubeUrl(trimmed);
  return match ? youTubeEmbedUrl(match.id) : trimmed;
}

/**
 * YouTube embed block. Wraps an iframe pointing to youtube-nocookie.com
 * inside a `BlockWithAlignableContents` container so users can align,
 * select, and delete it like other block-level decorators.
 *
 * The block renders a hover-action button (gear icon) at the top-right
 * corner — clicking it opens a Notion-style options popover where the
 * player options (autoplay, mute, loop, controls, start) can be edited
 * live or the embed removed.
 */
export class YouTubeNode extends DecoratorBlockNode {
  __url: string;
  __options: Required<YouTubeOptions>;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(
      node.__url,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedYouTubeNode): YouTubeNode {
    // `videoID` keeps pre-URL documents loading; it is never written back.
    const url =
      serialized.url ??
      (serialized.videoID ? youTubeEmbedUrl(serialized.videoID) : "");
    const node = $createYouTubeNode(url, serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      url: this.__url,
      options: this.__options,
    };
  }

  constructor(
    url: string,
    options: YouTubeOptions = {},
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__url = url;
    this.__options = { ...DEFAULT_OPTIONS, ...options };
  }

  getUrl(): string {
    return this.getLatest().__url;
  }

  setUrl(url: string): this {
    const writable = this.getWritable();
    writable.__url = url;
    return writable;
  }

  getOptions(): Required<YouTubeOptions> {
    return this.__options;
  }

  setOptions(options: YouTubeOptions): this {
    const writable = this.getWritable();
    // Filter undefined: stored options must satisfy Required<YouTubeOptions>.
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<keyof YouTubeOptions>) {
      const value = options[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    writable.__options = merged;
    return writable;
  }

  getTextContent(): string {
    return this.__url;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): React.ReactElement {
    const embedBlockTheme =
      (config.theme as { embedBlock?: { base?: string; focus?: string } })
        .embedBlock ?? {};
    const className = {
      base: embedBlockTheme.base ?? "",
      focus: embedBlockTheme.focus ?? "",
    };
    return (
      <BlockWithAlignableContents
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
      >
        <YouTubeBlock
          url={this.__url}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

/**
 * Apply the player options on top of the author's URL.
 *
 * Params the author already put in the URL win — they typed them
 * deliberately — so this only fills in what is missing. The node's
 * stored URL is never modified; this is render-time only.
 */
function buildEmbedSrc(
  rawUrl: string,
  options: Required<YouTubeOptions>,
): string {
  const base = toYouTubeEmbedSrc(rawUrl);
  if (!base) return "";

  let url: URL;
  try {
    url = new URL(base);
  } catch {
    // Not absolute (or otherwise unparseable) — hand it through as-is
    // rather than guessing.
    return base;
  }

  const setIfAbsent = (key: string, value: string) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  };

  if (options.autoplay) setIfAbsent("autoplay", "1");
  if (options.mute) setIfAbsent("mute", "1");
  if (options.controls === false) setIfAbsent("controls", "0");
  if (options.loop) {
    setIfAbsent("loop", "1");
    // YouTube requires `playlist` to be set for a single-video loop.
    const id = parseYouTubeUrl(base)?.id;
    if (id) setIfAbsent("playlist", id);
  }
  if (options.start > 0) setIfAbsent("start", String(options.start));

  return url.toString();
}

interface YouTubeBlockProps {
  url: string;
  options: Required<YouTubeOptions>;
  nodeKey: NodeKey;
}

function YouTubeBlock({ url, options, nodeKey }: YouTubeBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { url: string; options: YouTubeOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof YouTubeNode)) return;
        if (data.url !== node.getUrl()) node.setUrl(data.url);
        node.setOptions(data.options);
      });
      setOpen(false);
    },
    [editor, nodeKey],
  );

  const handleRemove = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof YouTubeNode) node.remove();
    });
    setOpen(false);
  }, [editor, nodeKey]);

  const src = buildEmbedSrc(url, options);

  return (
    <div className="relative group">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={src}
          className="absolute inset-0 w-full h-full rounded-lg border border-zinc-200"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube video"
        />
      </div>

      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
        triggerClassName={cn(
          "absolute top-2 right-2 z-10 transition-opacity",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        trigger={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title="Edit YouTube options"
            aria-label="Edit YouTube embed"
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <YouTubeForm
          mode="edit"
          initialUrl={url}
          initialOptions={options}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
          onRemove={handleRemove}
        />
      </Popover>
    </div>
  );
}

/** `url` is stored verbatim — whatever the author entered. */
export function $createYouTubeNode(
  url: string,
  options: YouTubeOptions = {},
): YouTubeNode {
  return new YouTubeNode(url, options);
}

export function $isYouTubeNode(
  node: LexicalNode | null | undefined,
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}

const YOUTUBE_URL_REGEX =
  /(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;

export interface YouTubeUrlMatch {
  id: string;
  /** Start time in seconds, parsed from `?t=` or `?start=` if present. */
  start?: number;
}

/**
 * Extract the 11-character video ID and optional start-time from any
 * YouTube URL form. Returns `null` if the URL doesn't match.
 */
export function parseYouTubeUrl(url: string): YouTubeUrlMatch | null {
  const trimmed = url.trim();
  const idMatch = YOUTUBE_URL_REGEX.exec(trimmed);
  if (!idMatch?.[1]) return null;
  const startMatch = /[?&](?:t|start)=(\d+)(?:s|S)?/.exec(trimmed);
  return {
    id: idMatch[1],
    start: startMatch ? parseInt(startMatch[1], 10) : undefined,
  };
}
