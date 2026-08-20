"use client";

import {
  $applyNodeReplacement,
  $createParagraphNode,
  setDOMUnmanaged,
  ElementNode,
  type EditorConfig,
  type Klass,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
} from "lexical";
import type { CmsBlockSpec } from "./cms";

/** Field values stored on the node, keyed by the spec's field names. */
export type NoteMeta = Record<string, string>;

/** Lexical's own element keys plus one top-level key per spec field. */
export type SerializedNoteBlockNode = SerializedElementNode & {
  [field: string]: unknown;
};

const HEADER_ATTR = "data-note-header";
const BODY_ATTR = "data-note-body";

/** Find the slot the chrome plugin portals a note's header into. */
export function getNoteHeaderElement(
  wrapper: HTMLElement,
): HTMLElement | null {
  return wrapper.querySelector<HTMLElement>(`[${HEADER_ATTR}]`);
}

/**
 * Shared behaviour for "note" blocks — structured metadata in the header
 * plus a **freely editable body**.
 *
 * Unlike the CMS decorator blocks these are `ElementNode`s: the body's
 * paragraphs are real children of the main editor, so typing, inline
 * formatting, undo/redo and selection all behave natively and the
 * content serializes as an ordinary Lexical `children` array rather than
 * as an opaque string.
 *
 * `createDOM` builds a wrapper holding a non-editable header and an
 * editable body; `getDOMSlot` points Lexical at the body so children land
 * there and the header stays clear for the chrome plugin
 * (`note-chrome.tsx`) to portal React into.
 */
export class NoteBlockNode extends ElementNode {
  __meta: NoteMeta;

  constructor(meta: NoteMeta = {}, key?: NodeKey) {
    super(key);
    this.__meta = { ...meta };
  }

  /** The spec this node was generated from — overridden by every class
   *  {@link createNoteNodeClass} produces. */
  getSpec(): CmsBlockSpec {
    throw new Error(
      "NoteBlockNode.getSpec() must be overridden — use createNoteNodeClass()",
    );
  }

  getMeta(): NoteMeta {
    return this.getLatest().__meta;
  }

  setMeta(meta: NoteMeta): this {
    const writable = this.getWritable();
    writable.__meta = { ...writable.__meta, ...meta };
    return writable;
  }

  exportJSON(): SerializedNoteBlockNode {
    return {
      ...this.__meta,
      ...super.exportJSON(),
    };
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
    // and reverts it on the next flush — the header would render once and
    // then silently vanish. `captureSelection` is what decorator DOM
    // uses, so clicks in the header don't disturb the caret.
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

  /**
   * The body is an independent editing region that may hold block-level
   * children, so it has to declare itself a shadow root.
   *
   * Without this, `RangeSelection.insertNodes` reaches its "block ancestor
   * whose parent is not a root or shadow root" branch and treats the note
   * as an inline-only element: it flattens whatever is being inserted to
   * inline content and **silently drops** anything with no inline form —
   * which is every block-level CMS node. Slash-inserting a gallery inside
   * the body did nothing at all.
   */
  isShadowRoot(): boolean {
    return true;
  }

  canIndent(): false {
    return false;
  }
}

export type NoteNodeClass = Klass<NoteBlockNode>;

/** Blank values for every field the spec declares. */
export function emptyNoteMeta(spec: CmsBlockSpec): NoteMeta {
  return Object.fromEntries(spec.fields.map((f) => [f.name, ""]));
}

/** Pull just the spec's declared fields out of a serialized payload,
 *  ignoring Lexical's own keys. */
function metaFromSerialized(
  spec: CmsBlockSpec,
  serialized: SerializedNoteBlockNode,
): NoteMeta {
  const meta: NoteMeta = {};
  for (const field of spec.fields) {
    const value = (serialized as Record<string, unknown>)[field.name];
    if (typeof value === "string") meta[field.name] = value;
    else if (typeof value === "number") meta[field.name] = String(value);
  }
  return meta;
}

/**
 * Build a concrete Lexical node class for one note spec.
 *
 * One class per type is what makes the JSON come out right: Lexical keys
 * its node registry by `getType()` and writes that same string into
 * `exportJSON()`, so the generated class must own the type.
 */
export function createNoteNodeClass(spec: CmsBlockSpec): NoteNodeClass {
  class GeneratedNoteNode extends NoteBlockNode {
    static getType(): string {
      return spec.type;
    }

    static clone(node: GeneratedNoteNode): GeneratedNoteNode {
      return new GeneratedNoteNode(node.__meta, node.__key);
    }

    /** Deliberately creates the node *empty*: Lexical appends the
     *  serialized `children` itself, so seeding a starter paragraph here
     *  would leave a stray empty one on every load. */
    static importJSON(
      serialized: SerializedNoteBlockNode,
    ): GeneratedNoteNode {
      return new GeneratedNoteNode({
        ...emptyNoteMeta(spec),
        ...metaFromSerialized(spec, serialized),
      });
    }

    getSpec(): CmsBlockSpec {
      return spec;
    }
  }

  return GeneratedNoteNode;
}

export function $isNoteBlockNode(
  node: LexicalNode | null | undefined,
): node is NoteBlockNode {
  return node instanceof NoteBlockNode;
}

/** Creates a note node with no children — for callers supplying their
 *  own body (deserialization, programmatic construction). */
export function $createEmptyNote(
  NodeClass: NoteNodeClass,
  spec: CmsBlockSpec,
  meta: NoteMeta = {},
): NoteBlockNode {
  return $applyNodeReplacement(
    new NodeClass({ ...emptyNoteMeta(spec), ...meta }),
  );
}

/** Creates a note node with one empty paragraph, so there is always
 *  somewhere to type. Use this when inserting from the UI. */
export function $createNote(
  NodeClass: NoteNodeClass,
  spec: CmsBlockSpec,
  meta: NoteMeta = {},
): NoteBlockNode {
  const node = $createEmptyNote(NodeClass, spec, meta);
  node.append($createParagraphNode());
  return node;
}
