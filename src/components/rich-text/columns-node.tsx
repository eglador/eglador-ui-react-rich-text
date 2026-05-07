"use client";

import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";

export type ColumnsGap = "small" | "medium" | "large";

export const COLUMNS_MIN = 2;
export const COLUMNS_MAX = 6;

// Static literal lookups so Tailwind's compiler picks the classes up
// from this source file at build time.
const COLS_CLASS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

const GAP_CLASS: Record<ColumnsGap, string> = {
  small: "gap-2",
  medium: "gap-4",
  large: "gap-8",
};

export type SerializedColumnsNode = Spread<
  {
    columnsCount: number;
    gap: ColumnsGap;
    mobileStack: boolean;
  },
  SerializedElementNode
>;

function buildColumnsClassName(
  count: number,
  gap: ColumnsGap,
  mobileStack: boolean,
): string {
  const parts = [
    "grid my-4",
    COLS_CLASS[count] ?? "grid-cols-2",
    GAP_CLASS[gap],
  ];
  if (mobileStack) parts.push("max-md:grid-cols-1");
  return parts.join(" ");
}

/**
 * Multi-column responsive grid container. Holds N `ColumnNode` children
 * (`COLUMNS_MIN` ≤ N ≤ `COLUMNS_MAX`); user content (paragraphs, lists,
 * images, ...) lives inside each column and is edited natively.
 *
 * Stacks to a single column on narrow viewports when `mobileStack` is on.
 */
export class ColumnsNode extends ElementNode {
  __count: number;
  __gap: ColumnsGap;
  __mobileStack: boolean;

  static getType(): string {
    return "columns";
  }

  static clone(node: ColumnsNode): ColumnsNode {
    return new ColumnsNode(
      node.__count,
      node.__gap,
      node.__mobileStack,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedColumnsNode): ColumnsNode {
    return $createColumnsNode({
      count: serialized.columnsCount,
      gap: serialized.gap,
      mobileStack: serialized.mobileStack,
    });
  }

  exportJSON(): SerializedColumnsNode {
    return {
      ...super.exportJSON(),
      columnsCount: this.__count,
      gap: this.__gap,
      mobileStack: this.__mobileStack,
    };
  }

  constructor(
    count: number = 2,
    gap: ColumnsGap = "medium",
    mobileStack: boolean = true,
    key?: NodeKey,
  ) {
    super(key);
    this.__count = clamp(count, COLUMNS_MIN, COLUMNS_MAX);
    this.__gap = gap;
    this.__mobileStack = mobileStack;
  }

  getCount(): number {
    return this.__count;
  }

  setCount(count: number): this {
    const writable = this.getWritable();
    writable.__count = clamp(count, COLUMNS_MIN, COLUMNS_MAX);
    return writable;
  }

  getGap(): ColumnsGap {
    return this.__gap;
  }

  setGap(gap: ColumnsGap): this {
    const writable = this.getWritable();
    writable.__gap = gap;
    return writable;
  }

  getMobileStack(): boolean {
    return this.__mobileStack;
  }

  setMobileStack(value: boolean): this {
    const writable = this.getWritable();
    writable.__mobileStack = value;
    return writable;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.className = buildColumnsClassName(
      this.__count,
      this.__gap,
      this.__mobileStack,
    );
    return div;
  }

  updateDOM(prev: ColumnsNode, dom: HTMLElement): boolean {
    if (
      prev.__count !== this.__count ||
      prev.__gap !== this.__gap ||
      prev.__mobileStack !== this.__mobileStack
    ) {
      dom.className = buildColumnsClassName(
        this.__count,
        this.__gap,
        this.__mobileStack,
      );
    }
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isShadowRoot(): boolean {
    return false;
  }
}

/**
 * Single column inside a `ColumnsNode`. Just a flex/grid cell wrapper —
 * children are arbitrary content (paragraph, heading, list, image, ...).
 */
export class ColumnNode extends ElementNode {
  static getType(): string {
    return "column";
  }

  static clone(node: ColumnNode): ColumnNode {
    return new ColumnNode(node.__key);
  }

  static importJSON(_serialized: SerializedElementNode): ColumnNode {
    return $createColumnNode();
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    // min-w-0 prevents long inline content (URLs, code) from blowing up
    // the grid cell beyond its track width.
    div.className =
      "min-w-0 min-h-[60px] rounded-md border border-dashed border-zinc-200 p-3 transition-colors";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }
}

interface CreateColumnsOptions {
  count?: number;
  gap?: ColumnsGap;
  mobileStack?: boolean;
}

export function $createColumnsNode(
  options: CreateColumnsOptions = {},
): ColumnsNode {
  return $applyNodeReplacement(
    new ColumnsNode(
      options.count ?? 2,
      options.gap ?? "medium",
      options.mobileStack ?? true,
    ),
  );
}

export function $createColumnNode(): ColumnNode {
  return $applyNodeReplacement(new ColumnNode());
}

export function $isColumnsNode(
  node: LexicalNode | null | undefined,
): node is ColumnsNode {
  return node instanceof ColumnsNode;
}

export function $isColumnNode(
  node: LexicalNode | null | undefined,
): node is ColumnNode {
  return node instanceof ColumnNode;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
