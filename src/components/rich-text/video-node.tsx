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
import { SettingsIcon, VideoIcon } from "../../lib/icons";
import { useResolvedSrc } from "./media-resolver-context";
import { VideoForm } from "./video-form";

export type VideoPreload = "none" | "metadata" | "auto";

export type VideoAspectRatio = "16:9" | "4:3" | "1:1" | "9:16";

export interface VideoOptions {
  /** Optional title (shown in form, not rendered on the video itself). */
  title?: string;
  /** Poster image URL displayed before playback. */
  poster?: string;
  /** Aspect ratio of the player frame (default `"16:9"`). */
  aspectRatio?: VideoAspectRatio;
  /** Auto-start playback on load (browsers require `muted`). */
  autoplay?: boolean;
  /** Loop after the video ends. */
  loop?: boolean;
  /** Start playback muted. Required by browsers when `autoplay` is on. */
  muted?: boolean;
  /** Show native player controls (default `true`). */
  controls?: boolean;
  /** Preload behaviour (default `"metadata"`). */
  preload?: VideoPreload;
  /**
   * CMS media ID. When set, the node is ID-addressed: `src` is resolved
   * at render time via `resolveImageSrc` on `RichTextEditor` and is left
   * out of `exportJSON()` — the document stores only the ID.
   */
  videoId?: string;
}

const DEFAULT_OPTIONS: Required<VideoOptions> = {
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

export type SerializedVideoNode = Spread<
  { src?: string; options?: VideoOptions },
  SerializedDecoratorBlockNode
>;

const ASPECT_CLASS: Record<VideoAspectRatio, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16] max-w-sm mx-auto",
};

/**
 * Video embed block backed by the native `<video>` element with poster
 * + aspect ratio support. Wrapped in `BlockWithAlignableContents` for
 * selection / alignment.
 *
 * Hover the embed → gear button at top-right → opens unified
 * `VideoForm` in `"edit"` mode.
 */
export class VideoNode extends DecoratorBlockNode {
  __src: string;
  __options: Required<VideoOptions>;

  static getType(): string {
    return "video";
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__src,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedVideoNode): VideoNode {
    const node = $createVideoNode(serialized.src ?? "", serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  /** ID-addressed videos omit `src` — see `ImageNode.exportJSON()`. */
  exportJSON(): SerializedVideoNode {
    const base = {
      ...super.exportJSON(),
      options: this.__options,
    };
    return this.__options.videoId ? base : { ...base, src: this.__src };
  }

  constructor(
    src: string,
    options: VideoOptions = {},
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__src = src;
    this.__options = { ...DEFAULT_OPTIONS, ...options };
  }

  getSrc(): string {
    return this.__src;
  }

  setSrc(src: string): this {
    const writable = this.getWritable();
    writable.__src = src;
    return writable;
  }

  getOptions(): Required<VideoOptions> {
    return this.__options;
  }

  setOptions(options: VideoOptions): this {
    const writable = this.getWritable();
    // Filter undefined: stored options must satisfy Required<VideoOptions>.
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<keyof VideoOptions>) {
      const value = options[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    writable.__options = merged;
    return writable;
  }

  getTextContent(): string {
    return this.__src || this.__options.videoId;
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
        <VideoBlock
          src={this.__src}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

interface VideoBlockProps {
  src: string;
  options: Required<VideoOptions>;
  nodeKey: NodeKey;
}

function VideoBlock({ src, options, nodeKey }: VideoBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { src: string; options: VideoOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof VideoNode)) return;
        if (data.src !== node.getSrc()) node.setSrc(data.src);
        node.setOptions(data.options);
      });
      setOpen(false);
    },
    [editor, nodeKey],
  );

  const handleRemove = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof VideoNode) node.remove();
    });
    setOpen(false);
  }, [editor, nodeKey]);

  // ID-addressed videos have no stored URL — ask the host to resolve it.
  const resolved = useResolvedSrc(options.videoId);
  const displaySrc = options.videoId ? resolved.src : src;

  return (
    <div
      className={cn(
        "relative group w-full bg-black rounded-lg overflow-hidden border border-zinc-200",
        ASPECT_CLASS[options.aspectRatio],
      )}
    >
      {!displaySrc && (
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-zinc-900 text-zinc-500",
            resolved.status === "loading" && "animate-pulse",
          )}
        >
          <VideoIcon className="size-6" />
          <span className="text-[11px] font-mono">
            {resolved.status === "loading"
              ? "Yükleniyor…"
              : options.videoId
                ? `#${options.videoId} bulunamadı`
                : "Video yok"}
          </span>
        </div>
      )}
      <video
        key={displaySrc ?? ""}
        src={displaySrc ?? undefined}
        poster={options.poster || undefined}
        controls={options.controls}
        autoPlay={options.autoplay}
        loop={options.loop}
        muted={options.muted}
        preload={options.preload}
        playsInline
        className="absolute inset-0 w-full h-full"
      >
        Your browser does not support the video element.
      </video>

      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
        triggerClassName={cn(
          // z-10: native <video> creates a stacking context in some browsers.
          "absolute top-2 right-2 z-10 transition-opacity",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        trigger={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title="Edit video options"
            aria-label="Edit video embed"
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <VideoForm
          mode="edit"
          initialSrc={src}
          initialOptions={options}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
          onRemove={handleRemove}
        />
      </Popover>
    </div>
  );
}

export function $createVideoNode(
  src: string,
  options: VideoOptions = {},
): VideoNode {
  return new VideoNode(src, options);
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}

const VIDEO_URL_REGEX = /\.(mp4|webm|ogv|mov|m4v)(\?.*)?(#.*)?$/i;

/** Heuristic — matches direct video file URLs by extension. */
export function isVideoUrl(url: string): boolean {
  return VIDEO_URL_REGEX.test(url.trim());
}
