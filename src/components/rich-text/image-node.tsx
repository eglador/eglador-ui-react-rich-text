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
import { ImageForm } from "./image-form";

export interface ImageOptions {
  /** Accessibility label — required for SEO and screen readers. */
  alt?: string;
  /** Optional caption shown below the image. */
  caption?: string;
  /** Maximum display width in pixels. `0` = natural / responsive. */
  maxWidth?: number;
}

const DEFAULT_OPTIONS: Required<ImageOptions> = {
  alt: "",
  caption: "",
  maxWidth: 0,
};

export type SerializedImageNode = Spread<
  { src: string; options?: ImageOptions },
  SerializedDecoratorBlockNode
>;

/**
 * Image embed block. Wraps a native `<img>` inside a `<figure>` with an
 * optional `<figcaption>`. Handles all browser-native image formats —
 * including animated GIFs, which the browser plays automatically.
 */
export class ImageNode extends DecoratorBlockNode {
  __src: string;
  __options: Required<ImageOptions>;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedImageNode): ImageNode {
    const node = $createImageNode(serialized.src, serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      options: this.__options,
    };
  }

  constructor(
    src: string,
    options: ImageOptions = {},
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

  getOptions(): Required<ImageOptions> {
    return this.__options;
  }

  setOptions(options: ImageOptions): this {
    const writable = this.getWritable();
    // Filter undefined: stored options must satisfy Required<ImageOptions>.
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<keyof ImageOptions>) {
      const value = options[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    writable.__options = merged;
    return writable;
  }

  getTextContent(): string {
    return this.__options.alt || this.__src;
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
        <ImageBlock
          src={this.__src}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

interface ImageBlockProps {
  src: string;
  options: Required<ImageOptions>;
  nodeKey: NodeKey;
}

function ImageBlock({ src, options, nodeKey }: ImageBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { src: string; options: ImageOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof ImageNode)) return;
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
      if (node instanceof ImageNode) node.remove();
    });
    setOpen(false);
  }, [editor, nodeKey]);

  const widthStyle =
    options.maxWidth > 0 ? { maxWidth: `${options.maxWidth}px` } : undefined;

  return (
    <figure className="text-center">
      {/* Inline-block wrapper sizes to the image, so the gear button
          stays anchored to the image's top-right corner regardless of
          maxWidth or alignment. */}
      <span className="relative group inline-block max-w-full">
        <img
          src={src}
          alt={options.alt || ""}
          className="block max-w-full h-auto rounded-lg border border-zinc-200 mx-auto"
          style={widthStyle}
        />
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
              title="Edit image options"
              aria-label="Edit image embed"
              className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
            >
              <SettingsIcon className="size-4" />
            </button>
          }
          contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
        >
          <ImageForm
            mode="edit"
            initialSrc={src}
            initialOptions={options}
            onSubmit={handleSave}
            onCancel={() => setOpen(false)}
            onRemove={handleRemove}
          />
        </Popover>
      </span>
      {options.caption && (
        <figcaption className="mt-2 text-xs text-zinc-500 italic">
          {options.caption}
        </figcaption>
      )}
    </figure>
  );
}

export function $createImageNode(
  src: string,
  options: ImageOptions = {},
): ImageNode {
  return new ImageNode(src, options);
}

export function $isImageNode(
  node: LexicalNode | null | undefined,
): node is ImageNode {
  return node instanceof ImageNode;
}

const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|webp|avif|svg|gif)(\?.*)?(#.*)?$/i;

/** Heuristic — matches direct image file URLs by extension (incl. .gif). */
export function isImageUrl(url: string): boolean {
  return IMAGE_URL_REGEX.test(url.trim());
}
