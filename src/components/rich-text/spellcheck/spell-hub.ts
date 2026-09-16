import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { LexicalEditor } from "lexical";
import { EMPTY_SPELL_RESULT, type SpellCheckResult } from "./types";

/** Imperative control over a mounted `<RichTextSpellCheck>`. */
export interface RichTextSpellCheckApi {
  /**
   * Check now, skipping the debounce. Resolves with the result for the
   * document as it is when the check finishes (re-running if the text
   * changed meanwhile). Pass `{ suggestions: true }` to also wait for
   * dictionary suggestions — useful right before showing an error list.
   */
  check(options?: { suggestions?: boolean }): Promise<SpellCheckResult>;
  /** The latest result, synchronously. */
  getResult(): SpellCheckResult;
  /** Select an issue's word, scroll it into view and open its suggestions. */
  focusIssue(id: string): boolean;
  /** Replace an issue's word. `false` if the word has changed since. */
  applySuggestion(id: string, replacement: string): boolean;
  /** Accept a word until the plugin unmounts. */
  ignoreWord(word: string): void;
  /** Accept a word and report it through `onAddWord` so the host can persist it. */
  addWord(word: string): Promise<void>;
}

export interface SpellCheckSnapshot {
  result: SpellCheckResult;
  /** `null` until a `<RichTextSpellCheck>` is mounted in this editor. */
  api: RichTextSpellCheckApi | null;
}

interface Hub {
  snapshot: SpellCheckSnapshot;
  listeners: Set<() => void>;
}

const hubs = new WeakMap<LexicalEditor, Hub>();

function getHub(editor: LexicalEditor): Hub {
  let hub = hubs.get(editor);
  if (!hub) {
    hub = {
      snapshot: { result: EMPTY_SPELL_RESULT, api: null },
      listeners: new Set(),
    };
    hubs.set(editor, hub);
  }
  return hub;
}

/** Called by the plugin whenever its result or API changes. */
export function publishSpellSnapshot(
  editor: LexicalEditor,
  patch: Partial<SpellCheckSnapshot>,
) {
  const hub = getHub(editor);
  hub.snapshot = { ...hub.snapshot, ...patch };
  for (const listener of hub.listeners) listener();
}

/**
 * The spell-check state of the surrounding editor, for components that
 * live inside `<RichTextEditor>` — a publish button, a custom error
 * panel, a toolbar badge:
 *
 * ```tsx
 * const { result, api } = useRichTextSpellCheck();
 * <button disabled={!result.passed}>Yayınla</button>
 * ```
 */
export function useRichTextSpellCheck(): SpellCheckSnapshot {
  const [editor] = useLexicalComposerContext();
  const hub = getHub(editor);
  const subscribe = React.useCallback(
    (listener: () => void) => {
      hub.listeners.add(listener);
      return () => hub.listeners.delete(listener);
    },
    [hub],
  );
  return React.useSyncExternalStore(
    subscribe,
    () => hub.snapshot,
    () => hub.snapshot,
  );
}

/** DOM event fired on the editor's root element after every result change. */
export const SPELL_CHECK_EVENT = "eglador:spellcheck";
