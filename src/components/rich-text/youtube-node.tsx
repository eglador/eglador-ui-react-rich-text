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
  { videoID: string; options?: YouTubeOptions },
  SerializedDecoratorBlockNode
>;

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
  __id: string;
  __options: Required<YouTubeOptions>;

  static getType(): string {
    return "youtube";
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(
      node.__id,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedYouTubeNode): YouTubeNode {
    const node = $createYouTubeNode(serialized.videoID, serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      videoID: this.__id,
      options: this.__options,
    };
  }

  constructor(
    id: string,
    options: YouTubeOptions = {},
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__id = id;
    this.__options = { ...DEFAULT_OPTIONS, ...options };
  }

  getId(): string {
    return this.__id;
  }

  setId(id: string): this {
    const writable = this.getWritable();
    writable.__id = id;
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
    return `https://www.youtube.com/watch?v=${this.__id}`;
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
          videoID={this.__id}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

function buildEmbedParams(
  videoID: string,
  options: Required<YouTubeOptions>,
): string {
  const params = new URLSearchParams();
  if (options.autoplay) params.set("autoplay", "1");
  if (options.mute) params.set("mute", "1");
  if (options.controls === false) params.set("controls", "0");
  if (options.loop) {
    params.set("loop", "1");
    // YouTube requires `playlist` to be set for a single-video loop.
    params.set("playlist", videoID);
  }
  if (options.start > 0) params.set("start", String(options.start));
  return params.toString();
}

interface YouTubeBlockProps {
  videoID: string;
  options: Required<YouTubeOptions>;
  nodeKey: NodeKey;
}

function YouTubeBlock({ videoID, options, nodeKey }: YouTubeBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { videoID: string; options: YouTubeOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof YouTubeNode)) return;
        if (data.videoID !== node.getId()) node.setId(data.videoID);
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

  const query = buildEmbedParams(videoID, options);
  const src = query
    ? `https://www.youtube-nocookie.com/embed/${videoID}?${query}`
    : `https://www.youtube-nocookie.com/embed/${videoID}`;

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
          initialUrl={`https://www.youtube.com/watch?v=${videoID}`}
          initialOptions={options}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
          onRemove={handleRemove}
        />
      </Popover>
    </div>
  );
}

export function $createYouTubeNode(
  id: string,
  options: YouTubeOptions = {},
): YouTubeNode {
  return new YouTubeNode(id, options);
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
