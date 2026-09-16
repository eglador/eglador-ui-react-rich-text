"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { cn } from "../../../lib/utils";
import {
  CircleAlertIcon,
  CircleCheckIcon,
  RefreshIcon,
  SpellCheckIcon,
} from "../../../lib/icons";
import { useMessages } from "../i18n";
import {
  analyzeSegments,
  buildResult,
  createSpellCaches,
  fillSuggestions,
  suggestWord,
} from "./analyze";
import {
  $collectSpellSegments,
  $replaceIssue,
  $selectIssue,
  getIssueRange,
} from "./editor-segments";
import {
  SPELL_CHECK_EVENT,
  publishSpellSnapshot,
  type RichTextSpellCheckApi,
} from "./spell-hub";
import { toEngineWord, trLower } from "./turkish";
import { getSharedTurkishSpellChecker } from "./turkish-checker";
import {
  EMPTY_SPELL_RESULT,
  type SpellAnalysisOptions,
  type SpellCheckResult,
  type SpellChecker,
  type SpellIssue,
} from "./types";

export interface RichTextSpellCheckProps extends SpellAnalysisOptions {
  /**
   * The spelling engine. Defaults to one page-wide Turkish Hunspell
   * checker (see `createTurkishSpellChecker`). Pass a memoised instance —
   * a new object each render restarts the check.
   */
  checker?: SpellChecker;
  /** Turn checking off without unmounting. Default `true`. */
  enabled?: boolean;
  /** Quiet period after typing before a check runs. Default `500` ms. */
  debounceMs?: number;
  /** Draw wavy underlines under issues. Default `true`. */
  underline?: boolean;
  /**
   * Look up dictionary suggestions for every issue in the background, so
   * `onResult` payloads carry them. With `false` they are fetched only
   * when the author opens an issue. Default `true`.
   */
  suggestions?: boolean;
  /**
   * Fires on every result change — status transitions and suggestion
   * updates included. `result.passed` is the pass / fail flag.
   */
  onResult?: (result: SpellCheckResult) => void;
  /** The author chose "Add to dictionary" — persist the word if you like. */
  onAddWord?: (word: string) => void;
  /** Imperative handle, for code outside the editor tree. */
  apiRef?: React.Ref<RichTextSpellCheckApi>;
  /** Render the built-in status bar. Default `true`. */
  showStatus?: boolean;
  className?: string;
  /** Replace the status bar with your own UI. */
  children?: (state: {
    result: SpellCheckResult;
    api: RichTextSpellCheckApi;
  }) => React.ReactNode;
}

const supportsHighlights = () =>
  typeof CSS !== "undefined" &&
  "highlights" in CSS &&
  typeof Highlight !== "undefined";

/** Keep the newest value reachable from long-lived callbacks. */
function useLatest<T>(value: T) {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Turkish spell checking for the editor — Hunspell with a Turkish
 * dictionary in a Web Worker, plus rules for mistakes a dictionary alone
 * handles badly (`herkez`, `değilmi`, `istanbul'da`).
 *
 * Issues get a wavy underline; click (or right-click) one for
 * suggestions. The outcome is exposed four ways — pick whichever reaches
 * the code that needs it:
 *
 * - `onResult` prop — every change, with `result.passed`
 * - `apiRef` prop — `await api.check()` before publishing
 * - `useRichTextSpellCheck()` — for components inside `<RichTextEditor>`
 * - `eglador:spellcheck` DOM event on the editor root
 *
 * ```tsx
 * <RichTextEditor>
 *   <RichTextToolbar />
 *   <RichTextContent />
 *   <RichTextSpellCheck onResult={(r) => setCanPublish(r.passed)} />
 * </RichTextEditor>
 * ```
 */
export function RichTextSpellCheck({
  checker: checkerProp,
  enabled = true,
  debounceMs = 500,
  underline = true,
  suggestions: autoSuggest = true,
  onResult,
  onAddWord,
  apiRef,
  showStatus = true,
  className,
  children,
  ignoreWords,
  ignoreProperNouns,
  ignoreAllCaps,
  commonMistakes,
  minWordLength,
}: RichTextSpellCheckProps) {
  const [editor] = useLexicalComposerContext();
  const t = useMessages();
  const checker = React.useMemo(
    () => checkerProp ?? getSharedTurkishSpellChecker(),
    [checkerProp],
  );
  const highlightName = `eglador-spell-${React.useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  const [result, setResult] = React.useState<SpellCheckResult>(
    enabled ? EMPTY_SPELL_RESULT : { ...EMPTY_SPELL_RESULT, status: "disabled" },
  );
  const [openIssueId, setOpenIssueId] = React.useState<string | null>(null);

  const resultRef = React.useRef(result);
  const cachesRef = React.useRef(createSpellCaches());
  const sessionIgnoreRef = React.useRef(new Set<string>());
  const generationRef = React.useRef(0);
  const readyRef = React.useRef(false);
  const rangesRef = React.useRef(new Map<string, Range>());

  const enabledRef = useLatest(enabled);
  const autoSuggestRef = useLatest(autoSuggest);
  const onResultRef = useLatest(onResult);
  const onAddWordRef = useLatest(onAddWord);
  const messagesRef = useLatest(t);
  const analysisRef = useLatest<SpellAnalysisOptions>({
    ignoreWords,
    ignoreProperNouns,
    ignoreAllCaps,
    commonMistakes,
    minWordLength,
  });

  // A new engine means earlier verdicts may not hold.
  React.useEffect(() => {
    cachesRef.current = createSpellCaches();
    readyRef.current = false;
  }, [checker]);

  const publish = React.useCallback(
    (next: SpellCheckResult) => {
      if (next === resultRef.current) return;
      resultRef.current = next;
      setResult(next);
      publishSpellSnapshot(editor, { result: next });
      onResultRef.current?.(next);
      editor.getRootElement()?.dispatchEvent(
        new CustomEvent(SPELL_CHECK_EVENT, { detail: next, bubbles: true }),
      );
    },
    [editor, onResultRef],
  );

  /** Move to an in-progress status, keeping the last issues visible. */
  const markBusy = React.useCallback(
    (status: "loading" | "checking") => {
      if (resultRef.current.status === status) return;
      publish({ ...resultRef.current, status, passed: false });
    },
    [publish],
  );

  // ── highlights ────────────────────────────────────────────────────

  const paint = React.useCallback(() => {
    const ranges = new Map<string, Range>();
    if (enabledRef.current) {
      for (const issue of resultRef.current.issues) {
        const range = getIssueRange(editor, issue);
        if (range) ranges.set(issue.id, range);
      }
    }
    rangesRef.current = ranges;

    if (!supportsHighlights()) return;
    if (underline && ranges.size > 0) {
      CSS.highlights.set(highlightName, new Highlight(...ranges.values()));
    } else {
      CSS.highlights.delete(highlightName);
    }
  }, [editor, enabledRef, underline, highlightName]);

  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
::highlight(${highlightName}) {
  text-decoration: underline wavy #ef4444;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 3px;
  text-decoration-skip-ink: none;
}
::highlight(${highlightName}-active) {
  background-color: rgb(239 68 68 / 0.16);
}`;
    document.head.appendChild(style);
    return () => {
      style.remove();
      if (supportsHighlights()) {
        CSS.highlights.delete(highlightName);
        CSS.highlights.delete(`${highlightName}-active`);
      }
    };
  }, [highlightName]);

  React.useLayoutEffect(() => {
    paint();
  }, [result, paint]);

  // ── checking ──────────────────────────────────────────────────────

  const runCheck = React.useCallback(
    async (waitForSuggestions: boolean): Promise<SpellCheckResult> => {
      const generation = ++generationRef.current;
      const isStale = () => generation !== generationRef.current;
      markBusy(readyRef.current ? "checking" : "loading");

      try {
        await checker.ready();
        readyRef.current = true;
        if (isStale()) return resultRef.current;

        const segments = editor
          .getEditorState()
          .read(() => $collectSpellSegments());
        const { issues, checkedWordCount } = await analyzeSegments(
          segments,
          checker,
          {
            ...analysisRef.current,
            ignoreWords: [
              ...(analysisRef.current.ignoreWords ?? []),
              ...sessionIgnoreRef.current,
            ],
          },
          messagesRef.current,
          cachesRef.current,
        );
        if (isStale()) return resultRef.current;

        let next = buildResult(issues, checkedWordCount);
        publish(next);

        const pending = issues.some((i) => i.suggestionsPending);
        if (pending && (waitForSuggestions || autoSuggestRef.current)) {
          const filling = fillSuggestions(
            issues,
            checker,
            cachesRef.current,
            (updated) => {
              if (!isStale()) publish({ ...resultRef.current, issues: updated });
            },
            isStale,
          );
          if (waitForSuggestions) {
            await filling;
            next = resultRef.current;
          } else {
            filling.catch(() => {
              // Suggestions are a nicety — the issues already went out.
            });
          }
        }
        return next;
      } catch (error) {
        if (isStale()) return resultRef.current;
        const failed: SpellCheckResult = {
          ...EMPTY_SPELL_RESULT,
          status: "error",
          checkedAt: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        };
        publish(failed);
        return failed;
      }
    },
    [
      editor,
      checker,
      publish,
      markBusy,
      analysisRef,
      messagesRef,
      autoSuggestRef,
    ],
  );

  // Check on mount, on option changes, and after typing settles.
  const optionsKey = JSON.stringify([
    ignoreWords,
    ignoreProperNouns,
    ignoreAllCaps,
    commonMistakes,
    minWordLength,
    t.spellMisspelling,
  ]);
  React.useEffect(() => {
    if (!enabled) {
      generationRef.current++;
      publish({ ...EMPTY_SPELL_RESULT, status: "disabled" });
      setOpenIssueId(null);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = (delay: number) => {
      clearTimeout(timer);
      timer = setTimeout(() => void runCheck(false), delay);
    };
    schedule(0);

    const unregister = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves, editorState, prevEditorState }) => {
        // Reconciliation may have replaced DOM text nodes under the ranges.
        paint();
        if (editorState === prevEditorState) return;
        if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
        // Anything in flight describes old text now.
        generationRef.current++;
        if (readyRef.current) markBusy("checking");
        schedule(debounceMs);
      },
    );
    return () => {
      clearTimeout(timer);
      unregister();
      generationRef.current++;
    };
  }, [
    editor,
    enabled,
    debounceMs,
    runCheck,
    paint,
    publish,
    markBusy,
    optionsKey,
  ]);

  // ── api ───────────────────────────────────────────────────────────

  const findIssue = React.useCallback(
    (id: string) => resultRef.current.issues.find((i) => i.id === id) ?? null,
    [],
  );

  const dropWord = React.useCallback(
    (word: string) => {
      const target = trLower(word);
      sessionIgnoreRef.current.add(target);
      const current = resultRef.current;
      const issues = current.issues.filter((issue) => {
        const lower = trLower(issue.word);
        return lower !== target && lower.split(/['’]/)[0] !== target;
      });
      if (issues.length === current.issues.length) return;
      const settled = current.status === "passed" || current.status === "failed";
      publish({
        ...current,
        issues,
        issueCount: issues.length,
        ...(settled
          ? {
              status: issues.length === 0 ? "passed" : "failed",
              passed: issues.length === 0,
            }
          : {}),
      });
    },
    [publish],
  );

  const api = React.useMemo<RichTextSpellCheckApi>(
    () => ({
      async check(options) {
        if (!enabledRef.current) return resultRef.current;
        for (;;) {
          const expected = generationRef.current + 1;
          const outcome = await runCheck(options?.suggestions ?? false);
          if (generationRef.current === expected) return outcome;
        }
      },

      getResult: () => resultRef.current,

      focusIssue(id) {
        const issue = findIssue(id);
        if (!issue) return false;
        let selected = false;
        editor.update(
          () => {
            selected = $selectIssue(issue);
          },
          { discrete: true },
        );
        if (!selected) return false;
        editor.focus();
        const range = getIssueRange(editor, issue);
        range?.startContainer.parentElement?.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
        setOpenIssueId(id);
        return true;
      },

      applySuggestion(id, replacement) {
        const issue = findIssue(id);
        if (!issue) return false;
        let replaced = false;
        editor.update(
          () => {
            replaced = $replaceIssue(issue, replacement);
          },
          { discrete: true },
        );
        if (replaced) setOpenIssueId(null);
        return replaced;
      },

      ignoreWord: (word) => dropWord(word),

      async addWord(word) {
        dropWord(word);
        cachesRef.current.verdicts.set(toEngineWord(word), true);
        onAddWordRef.current?.(word);
        await checker.addWord?.(toEngineWord(word));
      },
    }),
    [editor, checker, runCheck, findIssue, dropWord, enabledRef, onAddWordRef],
  );

  React.useImperativeHandle(apiRef, () => api, [api]);

  React.useEffect(() => {
    publishSpellSnapshot(editor, { api, result: resultRef.current });
    return () =>
      publishSpellSnapshot(editor, { api: null, result: EMPTY_SPELL_RESULT });
  }, [editor, api]);

  // ── root element: native spellcheck off, click → suggestions ──────

  React.useEffect(() => {
    if (!enabled) return;

    const hitTest = (x: number, y: number) => {
      for (const [id, range] of rangesRef.current) {
        for (const rect of range.getClientRects()) {
          if (
            x >= rect.left - 1 &&
            x <= rect.right + 1 &&
            y >= rect.top - 2 &&
            y <= rect.bottom + 2
          ) {
            return id;
          }
        }
      }
      return null;
    };
    const onClick = (event: MouseEvent) => {
      setOpenIssueId(hitTest(event.clientX, event.clientY));
    };
    const onContextMenu = (event: MouseEvent) => {
      const id = hitTest(event.clientX, event.clientY);
      if (!id) return;
      // Our suggestions replace the browser menu only on a flagged word.
      event.preventDefault();
      setOpenIssueId(id);
    };

    let current: HTMLElement | null = null;
    const detach = () => {
      if (!current) return;
      current.spellcheck = true;
      current.removeEventListener("click", onClick);
      current.removeEventListener("contextmenu", onContextMenu);
      current = null;
    };
    const unregister = editor.registerRootListener((root) => {
      detach();
      if (!root) return;
      current = root;
      // Two sets of red squiggles would only confuse.
      root.spellcheck = false;
      root.addEventListener("click", onClick);
      root.addEventListener("contextmenu", onContextMenu);
    });
    return () => {
      unregister();
      detach();
    };
  }, [editor, enabled]);

  // ── the open issue ────────────────────────────────────────────────

  const openIssue = openIssueId
    ? (result.issues.find((i) => i.id === openIssueId) ?? null)
    : null;

  React.useEffect(() => {
    if (!supportsHighlights()) return;
    const name = `${highlightName}-active`;
    const range = openIssue ? getIssueRange(editor, openIssue) : null;
    if (range) CSS.highlights.set(name, new Highlight(range));
    else CSS.highlights.delete(name);
  }, [editor, openIssue, highlightName, result]);

  // Suggestions were not prefetched — fetch the opened word's now.
  React.useEffect(() => {
    if (!openIssue?.suggestionsPending) return;
    let cancelled = false;
    const word = openIssue.word;
    suggestWord(word, checker, cachesRef.current)
      .then((suggestions) => {
        if (cancelled) return;
        publish({
          ...resultRef.current,
          issues: resultRef.current.issues.map((issue) =>
            issue.word === word
              ? { ...issue, suggestions, suggestionsPending: false }
              : issue,
          ),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [openIssue, checker, publish]);

  const state = { result, api };

  return (
    <>
      {children
        ? children(state)
        : showStatus && (
            <SpellCheckStatusBar
              result={result}
              api={api}
              className={className}
            />
          )}
      {openIssue && (
        <SpellSuggestionPopover
          issue={openIssue}
          getRange={() => getIssueRange(editor, openIssue)}
          onApply={(replacement) => api.applySuggestion(openIssue.id, replacement)}
          onIgnore={() => {
            api.ignoreWord(openIssue.word);
            setOpenIssueId(null);
          }}
          onAddWord={() => {
            void api.addWord(openIssue.word);
            setOpenIssueId(null);
          }}
          onClose={() => setOpenIssueId(null)}
        />
      )}
    </>
  );
}

RichTextSpellCheck.displayName = "RichTextSpellCheck";

// ── suggestion popover ──────────────────────────────────────────────

const VIEWPORT_PADDING = 8;
const GAP = 6;

interface SpellSuggestionPopoverProps {
  issue: SpellIssue;
  getRange: () => Range | null;
  onApply: (replacement: string) => void;
  onIgnore: () => void;
  onAddWord: () => void;
  onClose: () => void;
}

function SpellSuggestionPopover({
  issue,
  getRange,
  onApply,
  onIgnore,
  onAddWord,
  onClose,
}: SpellSuggestionPopoverProps) {
  const t = useMessages();
  const ref = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);
  const getRangeRef = useLatest(getRange);
  const onCloseRef = useLatest(onClose);

  // Anchored to the word, re-placed on scroll / resize, kept on screen.
  React.useLayoutEffect(() => {
    const place = () => {
      const el = ref.current;
      const range = getRangeRef.current();
      if (!el || !range) {
        onCloseRef.current();
        return;
      }
      const word = range.getBoundingClientRect();
      const { offsetWidth: w, offsetHeight: h } = el;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = word.bottom + GAP;
      if (top + h > vh - VIEWPORT_PADDING && word.top - GAP - h >= VIEWPORT_PADDING) {
        top = word.top - GAP - h;
      }
      top = Math.min(Math.max(top, VIEWPORT_PADDING), Math.max(VIEWPORT_PADDING, vh - h - VIEWPORT_PADDING));
      const left = Math.min(
        Math.max(word.left, VIEWPORT_PADDING),
        Math.max(VIEWPORT_PADDING, vw - w - VIEWPORT_PADDING),
      );
      setPosition((prev) =>
        prev && prev.top === top && prev.left === left ? prev : { top, left },
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [issue, getRangeRef, onCloseRef]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    // Capture: the editor's own click handler reopens on another word.
    document.addEventListener("mousedown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown, true);
    };
  }, [onCloseRef]);

  // Buttons must not steal focus from the editor, or the replacement
  // would land without a live selection.
  const keepFocus = (event: React.MouseEvent) => event.preventDefault();

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={`${t.spellCheck}: ${issue.word}`}
      data-spell-popover=""
      className="fixed z-[9999] w-64 rounded-lg border border-zinc-200 bg-white shadow-xl text-sm overflow-hidden"
      style={
        position
          ? { top: position.top, left: position.left }
          : { top: 0, left: 0, visibility: "hidden" }
      }
      onMouseDown={keepFocus}
    >
      <div className="px-3 pt-2.5 pb-2 border-b border-zinc-100">
        <div className="font-medium text-red-600 line-through decoration-red-300 truncate">
          {issue.word}
        </div>
        <div className="text-[11px] text-zinc-500">{issue.message}</div>
      </div>

      <div className="p-1">
        {issue.suggestionsPending ? (
          <div className="px-2 py-1.5 text-xs text-zinc-500 animate-pulse">
            {t.spellSuggestionsLoading}
          </div>
        ) : issue.suggestions.length === 0 ? (
          <div className="px-2 py-1.5 text-xs text-zinc-500">
            {t.spellNoSuggestions}
          </div>
        ) : (
          issue.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              data-spell-suggestion={suggestion}
              onMouseDown={keepFocus}
              onClick={() => onApply(suggestion)}
              className="block w-full text-left px-2 py-1.5 rounded font-medium text-zinc-900 hover:bg-emerald-50 hover:text-emerald-800 cursor-pointer"
            >
              {suggestion}
            </button>
          ))
        )}
      </div>

      <div className="flex border-t border-zinc-100 text-xs">
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={onIgnore}
          className="flex-1 px-3 py-2 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
        >
          {t.spellIgnore}
        </button>
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={onAddWord}
          className="flex-1 px-3 py-2 text-zinc-600 hover:bg-zinc-50 border-l border-zinc-100 cursor-pointer"
        >
          {t.spellAddToDictionary}
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ── status bar ──────────────────────────────────────────────────────

export interface SpellCheckStatusBarProps {
  result: SpellCheckResult;
  api: RichTextSpellCheckApi;
  className?: string;
}

/**
 * The default spell-check UI: status, issue count, and an expandable list
 * that jumps to each issue. Exported so custom layouts can reuse it.
 */
export function SpellCheckStatusBar({
  result,
  api,
  className,
}: SpellCheckStatusBarProps) {
  const t = useMessages();
  const [listOpen, setListOpen] = React.useState(false);
  const { status, issues } = result;
  const busy = status === "loading" || status === "checking";

  const label =
    status === "loading"
      ? t.spellLoading
      : status === "checking"
        ? t.spellChecking
        : status === "passed"
          ? t.spellPassed
          : status === "failed"
            ? t.spellIssues.replace("{count}", String(issues.length))
            : status === "error"
              ? t.spellError
              : status === "disabled"
                ? t.spellDisabled
                : t.spellCheck;

  return (
    <div
      className={cn("border-t border-zinc-200 bg-zinc-50 text-xs", className)}
      data-spell-status={status}
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span
          role="status"
          aria-live="polite"
          title={result.error}
          className={cn(
            "inline-flex items-center gap-1.5 font-medium",
            status === "passed" && "text-emerald-700",
            status === "failed" && "text-red-700",
            status === "error" && "text-amber-700",
            (busy || status === "idle" || status === "disabled") && "text-zinc-500",
          )}
        >
          {status === "passed" ? (
            <CircleCheckIcon className="size-3.5" />
          ) : status === "failed" || status === "error" ? (
            <CircleAlertIcon className="size-3.5" />
          ) : (
            <SpellCheckIcon className={cn("size-3.5", busy && "animate-pulse")} />
          )}
          {label}
        </span>

        <span className="flex-1" />

        {issues.length > 0 && (
          <button
            type="button"
            aria-expanded={listOpen}
            onClick={() => setListOpen((open) => !open)}
            className="px-2 py-0.5 rounded text-zinc-600 hover:bg-zinc-200/70 cursor-pointer"
          >
            {listOpen ? t.spellHideIssues : t.spellShowIssues}
          </button>
        )}
        <button
          type="button"
          title={t.spellRecheck}
          aria-label={t.spellRecheck}
          disabled={status === "disabled"}
          onClick={() => void api.check()}
          className="inline-flex items-center justify-center size-6 rounded text-zinc-500 hover:bg-zinc-200/70 hover:text-zinc-800 disabled:opacity-40 cursor-pointer"
        >
          <RefreshIcon className={cn("size-3.5", busy && "animate-spin")} />
        </button>
      </div>

      {listOpen && issues.length > 0 && (
        <ul className="max-h-56 overflow-y-auto border-t border-zinc-200 bg-white divide-y divide-zinc-100">
          {issues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => api.focusIssue(issue.id)}
                className="w-full text-left px-3 py-2 hover:bg-zinc-50 cursor-pointer"
              >
                <span className="font-medium text-red-600 line-through decoration-red-300">
                  {issue.word}
                </span>
                {issue.suggestions[0] && (
                  <>
                    <span className="text-zinc-400"> → </span>
                    <span className="font-medium text-emerald-700">
                      {issue.suggestions[0]}
                    </span>
                  </>
                )}
                <span className="ml-2 text-[11px] text-zinc-400">
                  {issue.message}
                </span>
                <span className="block mt-0.5 text-[11px] text-zinc-500 truncate">
                  {issue.context}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

SpellCheckStatusBar.displayName = "SpellCheckStatusBar";
