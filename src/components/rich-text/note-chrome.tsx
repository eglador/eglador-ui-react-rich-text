"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, type NodeKey } from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { SettingsIcon, TrashIcon } from "../../lib/icons";
import { CmsForm, MediaThumb, parseIdList } from "./cms";
import type { CmsBlockSpec, CmsFieldValues } from "./cms";
import {
  $isNoteBlockNode,
  getNoteHeaderElement,
  type NoteMeta,
} from "./note-block-node";
import { NewsMomentNode } from "./news-moment-node";
import { ContextNoteNode } from "./context-note-node";

/** Every note-style node whose header this plugin renders. */
const NOTE_CLASSES = [NewsMomentNode, ContextNoteNode];

/**
 * Renders the non-editable header of every note block in the document
 * (news moments, context notes).
 *
 * These are `ElementNode`s, so their bodies are edited natively and
 * Lexical owns that DOM — but the header slot each one reserves stays
 * untouched, which lets us portal real React (and therefore hooks like
 * `useResolvedSrc` for the thumbnails) into it.
 *
 * Rendered automatically by `RichTextContent`.
 */
export function RichTextNoteChrome(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();
  const [keys, setKeys] = React.useState<NodeKey[]>([]);

  React.useEffect(() => {
    // `skipInitialization: false` replays the nodes already in the
    // document, so this also covers content loaded via initialJson/Html.
    const live = new Set<NodeKey>();
    const unsubscribes = NOTE_CLASSES.map((NodeClass) =>
      editor.registerMutationListener(
        NodeClass,
        (mutations) => {
          for (const [key, mutation] of mutations) {
            if (mutation === "destroyed") live.delete(key);
            else live.add(key);
          }
          setKeys([...live]);
        },
        { skipInitialization: false },
      ),
    );
    return () => unsubscribes.forEach((off) => off());
  }, [editor]);

  if (keys.length === 0) return null;

  return (
    <>
      {keys.map((key) => (
        <NoteHeaderPortal key={key} nodeKey={key} />
      ))}
    </>
  );
}

RichTextNoteChrome.displayName = "RichTextNoteChrome";

/** @deprecated Renamed to `RichTextNoteChrome` — it now covers every
 *  note-style block, not just news moments. */
export const RichTextNewsMomentChrome = RichTextNoteChrome;

function NoteHeaderPortal({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = React.useState<{
    meta: NoteMeta;
    spec: CmsBlockSpec;
  } | null>(null);
  const [host, setHost] = React.useState<HTMLElement | null>(null);

  // Track the node's metadata, its spec and its header element; the
  // element is recreated whenever Lexical rebuilds the node's DOM.
  React.useEffect(() => {
    const sync = () => {
      const wrapper = editor.getElementByKey(nodeKey);
      setHost(wrapper ? getNoteHeaderElement(wrapper) : null);
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        setState(
          $isNoteBlockNode(node)
            ? { meta: node.getMeta(), spec: node.getSpec() }
            : null,
        );
      });
    };
    sync();
    return editor.registerUpdateListener(sync);
  }, [editor, nodeKey]);

  if (!host || !state) return null;

  return createPortal(
    <NoteHeader
      spec={state.spec}
      meta={state.meta}
      onSave={(values) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isNoteBlockNode(node)) node.setMeta(values);
        });
      }}
      onRemove={() => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isNoteBlockNode(node)) node.remove();
        });
      }}
    />,
    host,
  );
}

interface NoteHeaderProps {
  spec: CmsBlockSpec;
  meta: NoteMeta;
  onSave: (values: CmsFieldValues) => void;
  onRemove: () => void;
}

function NoteHeader({ spec, meta, onSave, onRemove }: NoteHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const ids = parseIdList(meta.images);
  // Absent on specs without date/time (a context note), in which case
  // the stamp simply isn't rendered.
  const stamp = [meta.date, meta.time].filter(Boolean).join(" · ");

  return (
    <div className="border-b border-zinc-200 bg-zinc-50">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-red-500" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          {spec.title}
        </span>
        {stamp && (
          <span className="font-mono text-[11px] tabular-nums text-zinc-500">
            {stamp}
          </span>
        )}

        <Popover
          open={open}
          onOpenChange={setOpen}
          placement="bottom-end"
          triggerClassName="ml-auto"
          trigger={
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              title={`${spec.title} ayarları`}
              aria-label={`${spec.title} üstbilgisini düzenle`}
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900"
            >
              <SettingsIcon className="size-3.5" />
            </button>
          }
          contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
        >
          <CmsForm
            spec={spec}
            mode="edit"
            initialValues={{ ...meta }}
            onSubmit={(values) => {
              onSave(values);
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            onRemove={() => {
              onRemove();
              setOpen(false);
            }}
          />
        </Popover>

        <button
          type="button"
          onClick={onRemove}
          title={`${spec.title} bloğunu sil`}
          aria-label={`${spec.title} bloğunu sil`}
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:border-red-300 hover:text-red-600"
        >
          <TrashIcon className="size-3.5" />
        </button>
      </div>

      {(meta.title || ids.length > 0) && (
        <div className="px-3 pb-2">
          {meta.title && (
            <div
              className={cn(
                "text-sm font-semibold text-zinc-900",
                ids.length > 0 && "mb-2",
              )}
            >
              {meta.title}
            </div>
          )}
          {ids.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ids.map((id) => (
                <div
                  key={id}
                  className="size-14 shrink-0 overflow-hidden rounded border border-zinc-200"
                >
                  <MediaThumb id={id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
