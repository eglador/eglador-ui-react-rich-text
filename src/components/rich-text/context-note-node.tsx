"use client";

import type { LexicalNode } from "lexical";
import { QuoteIcon } from "../../lib/icons";
import type { CmsBlockSpec, CmsFieldSpec } from "./cms";
import {
  $createEmptyNote,
  $createNote,
  createNoteNodeClass,
  NoteBlockNode,
  type NoteMeta,
} from "./note-block-node";

/**
 * Same shape as a news moment minus the timestamp — a context note is
 * background information attached to a story, not a dated entry in a
 * live blog, so `date` / `time` would only be noise.
 */
export const CONTEXT_NOTE_META_FIELDS: CmsFieldSpec[] = [
  {
    name: "title",
    label: "Başlık",
    inputType: "text",
    placeholder: "Notun başlığı",
  },
  {
    name: "images",
    label: "Resimler",
    inputType: "image-ids",
    placeholder: "345456, 345457",
    optional: true,
  },
];

export const CONTEXT_NOTE_SPEC: CmsBlockSpec = {
  type: "contextNote",
  title: "Context Note",
  description: "Başlık + düzenlenebilir içerik",
  icon: <QuoteIcon className="size-4" />,
  keywords: ["context", "note", "not", "bilgi", "arka", "plan"],
  fields: CONTEXT_NOTE_META_FIELDS,
};

export type ContextNoteMeta = NoteMeta;

export const CONTEXT_NOTE_DEFAULT_META: ContextNoteMeta = {
  title: "",
  images: "",
};

/** A context note: title and image IDs in the header, with a freely
 *  editable body. See `note-block-node.tsx` for the mechanics. */
export const ContextNoteNode = createNoteNodeClass(CONTEXT_NOTE_SPEC);

export function $createEmptyContextNoteNode(
  meta: ContextNoteMeta = {},
): NoteBlockNode {
  return $createEmptyNote(ContextNoteNode, CONTEXT_NOTE_SPEC, meta);
}

export function $createContextNoteNode(
  meta: ContextNoteMeta = {},
): NoteBlockNode {
  return $createNote(ContextNoteNode, CONTEXT_NOTE_SPEC, meta);
}

export function $isContextNoteNode(
  node: LexicalNode | null | undefined,
): node is NoteBlockNode {
  return node instanceof ContextNoteNode;
}

export type { SerializedNoteBlockNode as SerializedContextNoteNode } from "./note-block-node";
