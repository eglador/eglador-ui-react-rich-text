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
import { IframeForm } from "./iframe-form";

export type IframeAspectRatio = "16:9" | "4:3" | "1:1" | "9:16" | "custom";

export interface IframeOptions {
  /** Accessibility label — read by screen readers, helps SEO. */
  title?: string;
  /** Aspect ratio of the frame, or `"custom"` to use `customHeight` (px). */
  aspectRatio?: IframeAspectRatio;
  /** Height in px, used only when `aspectRatio === "custom"`. */
  customHeight?: number;
  /** Allow content to enter fullscreen via the Fullscreen API. */
  allowFullscreen?: boolean;
}

const DEFAULT_OPTIONS: Required<IframeOptions> = {
  title: "Embedded content",
  aspectRatio: "16:9",
  customHeight: 400,
  allowFullscreen: true,
};

export type SerializedIframeNode = Spread<
  { src: string; options?: IframeOptions },
  SerializedDecoratorBlockNode
>;

const ASPECT_CLASS: Record<Exclude<IframeAspectRatio, "custom">, string> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16] max-w-sm mx-auto",
};

/**
 * Generic iframe embed block. For embeds outside the dedicated YouTube /
 * Audio / Video flows: Figma, CodePen, Spotify, Maps, custom HTML pages.
 *
 * Not auto-embedded by URL paste — iframes can run third-party JS, so
 * inserting them must be an explicit user action via the Insert menu.
 */
export class IframeNode extends DecoratorBlockNode {
  __src: string;
  __options: Required<IframeOptions>;

  static getType(): string {
    return "iframe";
  }

  static clone(node: IframeNode): IframeNode {
    return new IframeNode(
      node.__src,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedIframeNode): IframeNode {
    const node = $createIframeNode(serialized.src, serialized.options);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedIframeNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      options: this.__options,
    };
  }

  constructor(
    src: string,
    options: IframeOptions = {},
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

  getOptions(): Required<IframeOptions> {
    return this.__options;
  }

  setOptions(options: IframeOptions): this {
    const writable = this.getWritable();
    // Filter undefined: stored options must satisfy Required<IframeOptions>.
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<keyof IframeOptions>) {
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
        <IframeBlock
          src={this.__src}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

interface IframeBlockProps {
  src: string;
  options: Required<IframeOptions>;
  nodeKey: NodeKey;
}

function IframeBlock({ src, options, nodeKey }: IframeBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: { src: string; options: IframeOptions }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof IframeNode)) return;
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
      if (node instanceof IframeNode) node.remove();
    });
    setOpen(false);
  }, [editor, nodeKey]);

  const wrapperClass =
    options.aspectRatio === "custom"
      ? "w-full"
      : ASPECT_CLASS[options.aspectRatio];
  const wrapperStyle =
    options.aspectRatio === "custom"
      ? { height: `${Math.max(100, options.customHeight)}px` }
      : undefined;

  return (
    <div
      className={cn(
        "relative group w-full bg-zinc-100 rounded-lg overflow-hidden border border-zinc-200",
        wrapperClass,
      )}
      style={wrapperStyle}
    >
      <iframe
        key={src}
        src={src}
        title={options.title}
        allowFullScreen={options.allowFullscreen}
        className="absolute inset-0 w-full h-full"
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
            title="Edit iframe options"
            aria-label="Edit iframe embed"
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <IframeForm
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

export function $createIframeNode(
  src: string,
  options: IframeOptions = {},
): IframeNode {
  return new IframeNode(src, options);
}

export function $isIframeNode(
  node: LexicalNode | null | undefined,
): node is IframeNode {
  return node instanceof IframeNode;
}
