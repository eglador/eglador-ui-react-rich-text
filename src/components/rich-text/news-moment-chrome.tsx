"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getNodeByKey, type NodeKey } from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import { SettingsIcon, TrashIcon } from "../../lib/icons";
import { CmsForm, MediaThumb, parseIdList } from "./cms";
import type { CmsFieldValues } from "./cms";
import {
  $isNewsMomentNode,
  getNewsMomentHeaderElement,
  NEWS_MOMENT_SPEC,
  NewsMomentNode,
  type NewsMomentMeta,
} from "./news-moment-node";

/**
 * Renders the non-editable header of every `NewsMomentNode` in the
 * document.
 *
 * `NewsMomentNode` is an `ElementNode`, so its body is edited natively
 * and Lexical owns that DOM — but the header slot it reserves stays
 * untouched, which lets us portal real React (and therefore hooks like
 * `useResolvedSrc` for the thumbnails) into it.
 *
 * Rendered automatically by `RichTextContent`.
 */
export function RichTextNewsMomentChrome(): React.ReactElement | null {
  const [editor] = useLexicalComposerContext();
  const [keys, setKeys] = React.useState<NodeKey[]>([]);

  React.useEffect(() => {
    // `skipInitialization: false` replays the nodes already in the
    // document, so this also covers content loaded via initialJson/Html.
    const live = new Set<NodeKey>();
    return editor.registerMutationListener(
      NewsMomentNode,
      (mutations) => {
        for (const [key, mutation] of mutations) {
          if (mutation === "destroyed") live.delete(key);
          else live.add(key);
        }
        setKeys([...live]);
      },
      { skipInitialization: false },
    );
  }, [editor]);

  if (keys.length === 0) return null;

  return (
    <>
      {keys.map((key) => (
        <NewsMomentHeaderPortal key={key} nodeKey={key} />
      ))}
    </>
  );
}

RichTextNewsMomentChrome.displayName = "RichTextNewsMomentChrome";

function NewsMomentHeaderPortal({ nodeKey }: { nodeKey: NodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [meta, setMeta] = React.useState<NewsMomentMeta | null>(null);
  const [host, setHost] = React.useState<HTMLElement | null>(null);

  // Track both the node's metadata and its header element; the element
  // is recreated whenever Lexical rebuilds the node's DOM.
  React.useEffect(() => {
    const sync = () => {
      const wrapper = editor.getElementByKey(nodeKey);
      setHost(wrapper ? getNewsMomentHeaderElement(wrapper) : null);
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        setMeta($isNewsMomentNode(node) ? node.getMeta() : null);
      });
    };
    sync();
    return editor.registerUpdateListener(sync);
  }, [editor, nodeKey]);

  if (!host || !meta) return null;

  return createPortal(
    <NewsMomentHeader
      meta={meta}
      onSave={(values) => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isNewsMomentNode(node)) node.setMeta(values as Partial<NewsMomentMeta>);
        });
      }}
      onRemove={() => {
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isNewsMomentNode(node)) node.remove();
        });
      }}
    />,
    host,
  );
}

interface NewsMomentHeaderProps {
  meta: NewsMomentMeta;
  onSave: (values: CmsFieldValues) => void;
  onRemove: () => void;
}

function NewsMomentHeader({ meta, onSave, onRemove }: NewsMomentHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const ids = parseIdList(meta.images);
  const stamp = [meta.date, meta.time].filter(Boolean).join(" · ");

  return (
    <div className="border-b border-zinc-200 bg-zinc-50">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="inline-block size-1.5 shrink-0 rounded-full bg-red-500" />
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">
          News moment
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
              title="News moment ayarları"
              aria-label="News moment üstbilgisini düzenle"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900"
            >
              <SettingsIcon className="size-3.5" />
            </button>
          }
          contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
        >
          <CmsForm
            spec={NEWS_MOMENT_SPEC}
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
          title="News moment'i sil"
          aria-label="News moment'i sil"
          className="inline-flex size-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 hover:border-red-300 hover:text-red-600"
        >
          <TrashIcon className="size-3.5" />
        </button>
      </div>

      {(meta.title || ids.length > 0) && (
        <div className="px-3 pb-2">
          {meta.title && (
            <div className={cn("text-sm font-semibold text-zinc-900", ids.length > 0 && "mb-2")}>
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
