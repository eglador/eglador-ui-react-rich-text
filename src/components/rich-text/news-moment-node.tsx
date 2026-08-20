"use client";

import type { LexicalNode } from "lexical";
import { CalendarClockIcon } from "../../lib/icons";
import type { CmsBlockSpec, CmsFieldSpec } from "./cms";
import {
  $createEmptyNote,
  $createNote,
  createNoteNodeClass,
  NoteBlockNode,
  type NoteMeta,
} from "./note-block-node";

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

export type NewsMomentMeta = NoteMeta;

export const NEWS_MOMENT_DEFAULT_META: NewsMomentMeta = {
  date: "",
  time: "",
  title: "",
  images: "",
};

/** Today's date / current time, in the shapes the native pickers want.
 *  Used to prefill the insert form — a live blog entry is almost always
 *  "now", and the user can still change either field. */
export function nowMeta(): { date: string; time: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
}

/** A news moment: date, time, title and image IDs in the header, with a
 *  freely editable body. See `note-block-node.tsx` for the mechanics. */
export const NewsMomentNode = createNoteNodeClass(NEWS_MOMENT_SPEC);

export function $createEmptyNewsMomentNode(
  meta: NewsMomentMeta = {},
): NoteBlockNode {
  return $createEmptyNote(NewsMomentNode, NEWS_MOMENT_SPEC, meta);
}

export function $createNewsMomentNode(
  meta: NewsMomentMeta = {},
): NoteBlockNode {
  return $createNote(NewsMomentNode, NEWS_MOMENT_SPEC, meta);
}

export function $isNewsMomentNode(
  node: LexicalNode | null | undefined,
): node is NoteBlockNode {
  return node instanceof NewsMomentNode;
}

export type { SerializedNoteBlockNode as SerializedNewsMomentNode } from "./note-block-node";
