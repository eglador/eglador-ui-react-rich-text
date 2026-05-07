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
import { ImageComparisonForm } from "./image-comparison-form";

export type ComparisonOrientation = "horizontal" | "vertical";

export type ComparisonAspectRatio =
  | "16:9"
  | "4:3"
  | "1:1"
  | "9:16"
  | "custom";

export interface ImageComparisonOptions {
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  showLabels?: boolean;
  orientation?: ComparisonOrientation;
  /** Initial divider position as a percentage (0-100). Default `50`. */
  initialPosition?: number;
  aspectRatio?: ComparisonAspectRatio;
  /** Used only when `aspectRatio === "custom"`. */
  customHeight?: number;
}

const DEFAULT_OPTIONS: Required<ImageComparisonOptions> = {
  beforeAlt: "",
  afterAlt: "",
  beforeLabel: "Before",
  afterLabel: "After",
  showLabels: true,
  orientation: "horizontal",
  initialPosition: 50,
  aspectRatio: "16:9",
  customHeight: 400,
};

export type SerializedImageComparisonNode = Spread<
  {
    beforeSrc: string;
    afterSrc: string;
    options?: ImageComparisonOptions;
  },
  SerializedDecoratorBlockNode
>;

const ASPECT_CLASS: Record<
  Exclude<ComparisonAspectRatio, "custom">,
  string
> = {
  "16:9": "aspect-video",
  "4:3": "aspect-[4/3]",
  "1:1": "aspect-square",
  "9:16": "aspect-[9/16] max-w-sm mx-auto",
};

/**
 * Before/after image comparison block. Two images stacked with a draggable
 * divider that reveals more of one or the other. Supports horizontal and
 * vertical orientations, mouse + touch + keyboard input.
 */
export class ImageComparisonNode extends DecoratorBlockNode {
  __beforeSrc: string;
  __afterSrc: string;
  __options: Required<ImageComparisonOptions>;

  static getType(): string {
    return "image-comparison";
  }

  static clone(node: ImageComparisonNode): ImageComparisonNode {
    return new ImageComparisonNode(
      node.__beforeSrc,
      node.__afterSrc,
      node.__options,
      node.__format,
      node.__key,
    );
  }

  static importJSON(
    serialized: SerializedImageComparisonNode,
  ): ImageComparisonNode {
    const node = $createImageComparisonNode(
      serialized.beforeSrc,
      serialized.afterSrc,
      serialized.options,
    );
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedImageComparisonNode {
    return {
      ...super.exportJSON(),
      beforeSrc: this.__beforeSrc,
      afterSrc: this.__afterSrc,
      options: this.__options,
    };
  }

  constructor(
    beforeSrc: string,
    afterSrc: string,
    options: ImageComparisonOptions = {},
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__beforeSrc = beforeSrc;
    this.__afterSrc = afterSrc;
    this.__options = { ...DEFAULT_OPTIONS, ...options };
  }

  getBeforeSrc(): string {
    return this.__beforeSrc;
  }

  getAfterSrc(): string {
    return this.__afterSrc;
  }

  setSources(beforeSrc: string, afterSrc: string): this {
    const writable = this.getWritable();
    writable.__beforeSrc = beforeSrc;
    writable.__afterSrc = afterSrc;
    return writable;
  }

  getOptions(): Required<ImageComparisonOptions> {
    return this.__options;
  }

  setOptions(options: ImageComparisonOptions): this {
    const writable = this.getWritable();
    const merged = { ...writable.__options };
    for (const key of Object.keys(options) as Array<
      keyof ImageComparisonOptions
    >) {
      const value = options[key];
      if (value !== undefined) {
        (merged as Record<string, unknown>)[key] = value;
      }
    }
    writable.__options = merged;
    return writable;
  }

  getTextContent(): string {
    return `${this.__beforeSrc} | ${this.__afterSrc}`;
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
        <ImageComparisonBlock
          beforeSrc={this.__beforeSrc}
          afterSrc={this.__afterSrc}
          options={this.__options}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

interface ImageComparisonBlockProps {
  beforeSrc: string;
  afterSrc: string;
  options: Required<ImageComparisonOptions>;
  nodeKey: NodeKey;
}

function ImageComparisonBlock({
  beforeSrc,
  afterSrc,
  options,
  nodeKey,
}: ImageComparisonBlockProps) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);

  const handleSave = React.useCallback(
    (data: {
      beforeSrc: string;
      afterSrc: string;
      options: ImageComparisonOptions;
    }) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (!(node instanceof ImageComparisonNode)) return;
        if (
          data.beforeSrc !== node.getBeforeSrc() ||
          data.afterSrc !== node.getAfterSrc()
        ) {
          node.setSources(data.beforeSrc, data.afterSrc);
        }
        node.setOptions(data.options);
      });
      setOpen(false);
    },
    [editor, nodeKey],
  );

  const handleRemove = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof ImageComparisonNode) node.remove();
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
        "relative group w-full rounded-lg overflow-hidden border border-zinc-200 select-none",
        wrapperClass,
      )}
      style={wrapperStyle}
    >
      <ComparisonSlider
        beforeSrc={beforeSrc}
        afterSrc={afterSrc}
        options={options}
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
            title="Edit comparison options"
            aria-label="Edit image comparison"
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <ImageComparisonForm
          mode="edit"
          initialBeforeSrc={beforeSrc}
          initialAfterSrc={afterSrc}
          initialOptions={options}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
          onRemove={handleRemove}
        />
      </Popover>
    </div>
  );
}

interface ComparisonSliderProps {
  beforeSrc: string;
  afterSrc: string;
  options: Required<ImageComparisonOptions>;
}

function ComparisonSlider({
  beforeSrc,
  afterSrc,
  options,
}: ComparisonSliderProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const draggingRef = React.useRef(false);
  const [position, setPosition] = React.useState(options.initialPosition);

  React.useEffect(() => {
    setPosition(options.initialPosition);
  }, [options.initialPosition]);

  const isVertical = options.orientation === "vertical";

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = isVertical
      ? ((clientY - rect.top) / rect.height) * 100
      : ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -5;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 5;
    else if (e.key === "Home") delta = -100;
    else if (e.key === "End") delta = 100;
    else return;
    e.preventDefault();
    setPosition((p) => Math.max(0, Math.min(100, p + delta)));
  };

  const afterClipPath = isVertical
    ? `inset(${position}% 0 0 0)`
    : `inset(0 0 0 ${position}%)`;

  const dividerStyle: React.CSSProperties = isVertical
    ? { top: `${position}%` }
    : { left: `${position}%` };

  return (
    <div ref={containerRef} className="absolute inset-0">
      <img
        src={beforeSrc}
        alt={options.beforeAlt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0" style={{ clipPath: afterClipPath }}>
        <img
          src={afterSrc}
          alt={options.afterAlt}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {options.showLabels && (
        <>
          <span
            className={cn(
              "absolute px-2 py-1 text-xs bg-black/60 text-white rounded-md backdrop-blur-sm pointer-events-none",
              isVertical ? "top-2 left-1/2 -translate-x-1/2" : "top-2 left-2",
            )}
          >
            {options.beforeLabel}
          </span>
          <span
            className={cn(
              "absolute px-2 py-1 text-xs bg-black/60 text-white rounded-md backdrop-blur-sm pointer-events-none",
              isVertical
                ? "bottom-2 left-1/2 -translate-x-1/2"
                : "top-2 right-2",
            )}
          >
            {options.afterLabel}
          </span>
        </>
      )}

      <div
        className={cn(
          "absolute bg-white pointer-events-none shadow-[0_0_4px_rgba(0,0,0,0.4)]",
          isVertical ? "left-0 right-0 h-0.5" : "top-0 bottom-0 w-0.5",
        )}
        style={dividerStyle}
      />

      <button
        type="button"
        role="slider"
        aria-label="Image comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-orientation={isVertical ? "vertical" : "horizontal"}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={dividerStyle}
        className={cn(
          "absolute size-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing border border-zinc-200 hover:scale-105 transition-transform z-[5]",
          isVertical
            ? "left-1/2 -translate-x-1/2 -translate-y-1/2"
            : "top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
      >
        <span className="inline-flex items-center gap-0.5 text-zinc-600">
          <span
            className={cn(
              "block bg-zinc-500 rounded",
              isVertical ? "w-3 h-0.5" : "w-0.5 h-3",
            )}
          />
          <span
            className={cn(
              "block bg-zinc-500 rounded",
              isVertical ? "w-3 h-0.5" : "w-0.5 h-3",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export function $createImageComparisonNode(
  beforeSrc: string,
  afterSrc: string,
  options: ImageComparisonOptions = {},
): ImageComparisonNode {
  return new ImageComparisonNode(beforeSrc, afterSrc, options);
}

export function $isImageComparisonNode(
  node: LexicalNode | null | undefined,
): node is ImageComparisonNode {
  return node instanceof ImageComparisonNode;
}
