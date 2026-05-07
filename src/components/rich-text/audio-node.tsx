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
import { AudioLinesIcon, SettingsIcon } from "../../lib/icons";
import { AudioForm } from "./audio-form";

export type AudioPreload = "none" | "metadata" | "auto";

export interface AudioOptions {
  /** Optional title shown above the player */
  title?: string;
  /** Auto-start playback on load (browsers require `muted` for this). */
  autoplay?: boolean;
  /** Loop after the track ends. */
  loop?: boolean;
  /** Start playback muted. Required by browsers when `autoplay` is on. */
  muted?: boolean;
  /** Show native player controls (default `true`). */
  controls?: boolean;
  /** How aggressively to preload the source (default `"metadata"`). */
  preload?: AudioPreload;
}

const DEFAULT_OPTIONS: Required<AudioOptions> = {
  title: "",
  autoplay: false,
  loop: false,
  muted: false,
  controls: true,
  preload: "metadata",
};

export type SerializedAudioNode = Spread<
  { src: string; options?: AudioOptions },
  SerializedDecoratorBlockNode
>;

/**
 * Audio embed block backed by the native `<audio>` element. Wrapped in
 * `BlockWithAlignableContents` for selection / alignment support.
 *
 * Hover the embed → gear button at top-right → opens unified
 * `AudioForm` in `"edit"` mode (URL + options + Delete).
 */
export class AudioNode extends DecoratorBlockNode {
  __src: string;
  __options: Required<AudioOptions>;

  static getType(): string {
    return "audio";
  }

  static clone(node: AudioNode): AudioNode {
    return new AudioNode(
      node.__src,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedAudioNode): AudioNode {
    const node = $createAudioNode(serialized.src, serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedAudioNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      options: this.__options,
    };
  }

  constructor(
    src: string,
    options: AudioOptions = {},
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

  getOptions(): Required<AudioOptions> {
    return this.__options;
  }

  setOptions(options: AudioOptions): this {
    const writable = this.getWritable();
    // Filter undefined: stored options must satisfy Required<AudioOptions>.
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<keyof AudioOptions>) {
      const value = options[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    writable.__options = merged;
    return writable;
  }

  getTextContent(): string {
    return this.__src;
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
        <AudioBlock
          src={this.__src}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

interface AudioBlockProps {
  src: string;
  options: Required<AudioOptions>;
  nodeKey: NodeKey;
}

function AudioBlock({ src, options, nodeKey }: AudioBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { src: string; options: AudioOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof AudioNode)) return;
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
      if (node instanceof AudioNode) node.remove();
    });
    setOpen(false);
  }, [editor, nodeKey]);

  return (
    <div className="relative group rounded-lg border border-zinc-200 bg-zinc-50 p-3 pr-12">
      {options.title && (
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-zinc-700">
          <AudioLinesIcon className="size-3.5 text-zinc-500 shrink-0" />
          <span className="truncate">{options.title}</span>
        </div>
      )}
      <audio
        key={src}
        src={src}
        controls={options.controls}
        autoPlay={options.autoplay}
        loop={options.loop}
        muted={options.muted}
        preload={options.preload}
        className="w-full"
      >
        Your browser does not support the audio element.
      </audio>

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
            title="Edit audio options"
            aria-label="Edit audio embed"
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <AudioForm
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

export function $createAudioNode(
  src: string,
  options: AudioOptions = {},
): AudioNode {
  return new AudioNode(src, options);
}

export function $isAudioNode(
  node: LexicalNode | null | undefined,
): node is AudioNode {
  return node instanceof AudioNode;
}

const AUDIO_URL_REGEX = /\.(mp3|ogg|wav|m4a|aac|flac|opus)(\?.*)?(#.*)?$/i;

/** Heuristic — matches direct audio file URLs by extension. */
export function isAudioUrl(url: string): boolean {
  return AUDIO_URL_REGEX.test(url.trim());
}
