"use client";

import {
  $applyNodeReplacement,
  $createParagraphNode,
  setDOMUnmanaged,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from "lexical";
import { CalendarClockIcon } from "../../lib/icons";
import type { CmsBlockSpec, CmsFieldSpec } from "./cms";

export type NewsMomentMeta = {
  /** `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm`. */
  time: string;
  title: string;
  /** Comma-separated media IDs, resolved via `resolveImageSrc`. */
  images: string;
};

export const NEWS_MOMENT_DEFAULT_META: NewsMomentMeta = {
  date: "",
  time: "",
  title: "",
  images: "",
};

/**
 * Metadata form fields — the body is edited inline, so it has no field
 * here. Date, time and title are required: they are asked for when the
 * block is inserted and can be revised later from its header.
 */
export const NEWS_MOMENT_META_FIELDS: CmsFieldSpec[] = [
  { name: "date", label: "Tarih", inputType: "date" },
  { name: "time", label: "Saat", inputType: "time" },
  {
    name: "title",
    label: "Başlık",
    inputType: "text",
    placeholder: "Gelişmenin başlığı",
  },
  {
    name: "images",
    label: "Resimler",
    inputType: "image-ids",
    placeholder: "345456, 345457",
    optional: true,
  },
];

/** Shared by the insert form and the in-document header's edit popover,
 *  so both always ask for exactly the same things. */
export const NEWS_MOMENT_SPEC: CmsBlockSpec = {
  type: "newsMoment",
  title: "News Moment",
  description: "Tarih, saat, başlık + düzenlenebilir içerik",
  icon: <CalendarClockIcon className="size-4" />,
  keywords: ["news", "moment", "an", "haber", "canli", "canlı"],
  fields: NEWS_MOMENT_META_FIELDS,
};

/** Today's date / current time, in the shapes the native pickers want.
 *  Used to prefill the insert form — a live blog entry is almost always
 *  "now", and the user can still change either field. */
export function nowMeta(): Pick<NewsMomentMeta, "date" | "time"> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

export type SerializedNewsMomentNode = Spread<
  NewsMomentMeta,
  SerializedElementNode
>;

const HEADER_ATTR = "data-news-moment-header";
const BODY_ATTR = "data-news-moment-body";

/** Find the slot the chrome plugin portals its header into. */
export function getNewsMomentHeaderElement(
  wrapper: HTMLElement,
): HTMLElement | null {
  return wrapper.querySelector<HTMLElement>(`[${HEADER_ATTR}]`);
}

/**
 * A news moment: structured metadata (date, time, title, image IDs) plus
 * a **freely editable body**.
 *
 * Unlike the other CMS blocks this is an `ElementNode`, not a decorator.
 * The body's paragraphs are real children of the main editor, so typing,
 * inline formatting, undo/redo and selection all behave natively and the
 * content serializes as an ordinary Lexical `children` array rather than
 * as an opaque string.
 *
 * `createDOM` builds a wrapper holding a non-editable header and an
 * editable body; `getDOMSlot` points Lexical at the body so children
 * land there and the header stays clear for the chrome plugin
 * (`news-moment-chrome.tsx`) to portal React into.
 */
export class NewsMomentNode extends ElementNode {
  __meta: NewsMomentMeta;

  static getType(): string {
    return "newsMoment";
  }

  static clone(node: NewsMomentNode): NewsMomentNode {
    return new NewsMomentNode(node.__meta, node.__key);
  }

  /** Deliberately uses the *empty* factory: Lexical appends the
   *  serialized `children` itself, so seeding a starter paragraph here
   *  would leave a stray empty one on every load. */
  static importJSON(serialized: SerializedNewsMomentNode): NewsMomentNode {
    return $createEmptyNewsMomentNode({
      date: serialized.date,
      time: serialized.time,
      title: serialized.title,
      images: serialized.images,
    });
  }

  exportJSON(): SerializedNewsMomentNode {
    return {
      ...super.exportJSON(),
      ...this.__meta,
    };
  }

  constructor(meta: Partial<NewsMomentMeta> = {}, key?: NodeKey) {
    super(key);
    this.__meta = { ...NEWS_MOMENT_DEFAULT_META, ...meta };
  }

  getMeta(): NewsMomentMeta {
    return this.getLatest().__meta;
  }

  setMeta(meta: Partial<NewsMomentMeta>): this {
    const writable = this.getWritable();
    writable.__meta = { ...writable.__meta, ...meta };
    return writable;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const wrapper = document.createElement("div");
    wrapper.className =
      "my-3 overflow-hidden rounded-lg border border-zinc-200 bg-white";

    // Chrome host. Kept out of the editable flow so the caret can never
    // land in it; the plugin renders React into this element.
    const header = document.createElement("div");
    header.setAttribute(HEADER_ATTR, "");
    header.setAttribute("contenteditable", "false");
    header.className = "select-none";
    // Without this, Lexical's MutationObserver treats the React chrome
    // we portal in here as foreign DOM injected into the contenteditable
    // and reverts it on the next flush — the header would render once
    // and then silently vanish. `captureSelection` is what decorator
    // DOM uses, so clicks in the header don't disturb the caret.
    setDOMUnmanaged(header, { captureSelection: true });

    const body = document.createElement("div");
    body.setAttribute(BODY_ATTR, "");
    body.className = "px-3 py-2";

    wrapper.append(header, body);
    return wrapper;
  }

  /** Children belong in the body, not next to the header. */
  getDOMSlot(element: HTMLElement) {
    const body = element.querySelector<HTMLElement>(`[${BODY_ATTR}]`);
    return super.getDOMSlot(element).withElement(body ?? element);
  }

  updateDOM(): false {
    // Metadata is rendered by the chrome plugin, which re-renders on its
    // own; the wrapper itself never changes.
    return false;
  }

  isShadowRoot(): boolean {
    return false;
  }

  canIndent(): false {
    return false;
  }
}

/** Creates the node with no children — for callers that supply their
 *  own body (deserialization, programmatic construction). */
export function $createEmptyNewsMomentNode(
  meta: Partial<NewsMomentMeta> = {},
): NewsMomentNode {
  return $applyNodeReplacement(new NewsMomentNode(meta));
}

/** Creates the node with one empty paragraph, so there is always
 *  somewhere to type. Use this when inserting from the UI. */
export function $createNewsMomentNode(
  meta: Partial<NewsMomentMeta> = {},
): NewsMomentNode {
  const node = $createEmptyNewsMomentNode(meta);
  node.append($createParagraphNode());
  return node;
}

export function $isNewsMomentNode(
  node: LexicalNode | null | undefined,
): node is NewsMomentNode {
  return node instanceof NewsMomentNode;
}
