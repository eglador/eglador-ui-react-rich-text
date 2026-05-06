"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { cn } from "../../lib/utils";

type TargetValue = "" | "_blank" | "_self" | "_parent" | "_top";

interface LinkState {
  url: string;
  target: TargetValue;
  rel: {
    nofollow: boolean;
    noopener: boolean;
    noreferrer: boolean;
  };
  hasExisting: boolean;
}

const blank: LinkState = {
  url: "",
  target: "",
  rel: { nofollow: false, noopener: false, noreferrer: false },
  hasExisting: false,
};

function readSelectionLink(editor: LexicalEditor): LinkState {
  return editor.read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return blank;
    const node = selection.anchor.getNode();
    const parent = node.getParent();
    const linkNode = $isLinkNode(node)
      ? node
      : $isLinkNode(parent)
        ? parent
        : null;
    if (!linkNode) return blank;
    const relStr = linkNode.getRel() ?? "";
    return {
      url: linkNode.getURL() ?? "",
      target: ((linkNode.getTarget() ?? "") as TargetValue),
      rel: {
        nofollow: /\bnofollow\b/.test(relStr),
        noopener: /\bnoopener\b/.test(relStr),
        noreferrer: /\bnoreferrer\b/.test(relStr),
      },
      hasExisting: true,
    };
  });
}

interface LinkEditFormProps {
  /** Autofocus the URL input on mount (default `true`) */
  autoFocusUrl?: boolean;
  /** Show a Cancel button alongside Update/Add (default `true`) */
  showCancel?: boolean;
  /** Called after Apply / Remove / Cancel — host should close the surrounding container */
  onClose: () => void;
}

/**
 * Shared form for creating / editing a Lexical link via `TOGGLE_LINK_COMMAND`.
 * Reads the current selection's link attributes once on mount and tracks
 * user edits in local state. Apply dispatches the command with full
 * LinkAttributes payload (`url`, `target`, `rel`).
 */
export function LinkEditForm({
  autoFocusUrl = true,
  showCancel = true,
  onClose,
}: LinkEditFormProps) {
  const [editor] = useLexicalComposerContext();
  const [state, setState] = React.useState<LinkState>(() =>
    readSelectionLink(editor),
  );

  const apply = () => {
    const url = state.url.trim();
    if (!url) return;
    const relTokens = (Object.keys(state.rel) as Array<keyof typeof state.rel>)
      .filter((k) => state.rel[k]);
    const rel = relTokens.length > 0 ? relTokens.join(" ") : null;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
      url,
      target: state.target || null,
      rel,
    });
    onClose();
  };

  const remove = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    onClose();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="space-y-3"
    >
      <Field label="URL">
        <input
          type="url"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocusUrl}
          value={state.url}
          onChange={(e) =>
            setState((s) => ({ ...s, url: e.target.value }))
          }
          placeholder="https://example.com"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </Field>

      <Field label="Target">
        <select
          value={state.target}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              target: e.target.value as TargetValue,
            }))
          }
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="">Default (same tab)</option>
          <option value="_blank">New tab (_blank)</option>
          <option value="_self">Same tab (_self)</option>
          <option value="_parent">Parent frame (_parent)</option>
          <option value="_top">Top-level frame (_top)</option>
        </select>
      </Field>

      <Field label="Rel">
        <div className="flex flex-wrap gap-3">
          <RelCheckbox
            label="nofollow"
            checked={state.rel.nofollow}
            onChange={(v) =>
              setState((s) => ({ ...s, rel: { ...s.rel, nofollow: v } }))
            }
          />
          <RelCheckbox
            label="noopener"
            checked={state.rel.noopener}
            onChange={(v) =>
              setState((s) => ({ ...s, rel: { ...s.rel, noopener: v } }))
            }
          />
          <RelCheckbox
            label="noreferrer"
            checked={state.rel.noreferrer}
            onChange={(v) =>
              setState((s) => ({ ...s, rel: { ...s.rel, noreferrer: v } }))
            }
          />
        </div>
      </Field>

      <div className="flex items-center justify-between gap-2 pt-1">
        {state.hasExisting ? (
          <button
            type="button"
            onClick={remove}
            className="text-xs text-red-600 hover:underline cursor-pointer"
          >
            Remove link
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {showCancel && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!state.url.trim()}
            className={cn(
              "px-3 py-1.5 text-xs rounded text-white cursor-pointer",
              "bg-blue-600 hover:bg-blue-700",
              "disabled:bg-zinc-300 disabled:cursor-not-allowed",
            )}
          >
            {state.hasExisting ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </form>
  );
}

LinkEditForm.displayName = "LinkEditForm";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-700 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

interface RelCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function RelCheckbox({ label, checked, onChange }: RelCheckboxProps) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />
      <code className="text-zinc-700">{label}</code>
    </label>
  );
}
