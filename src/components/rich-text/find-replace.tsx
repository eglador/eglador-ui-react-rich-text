"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $isTextNode,
  $isElementNode,
  $createRangeSelection,
  $setSelection,
  $getNodeByKey,
  type LexicalNode,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { cn } from "../../lib/utils";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ReplaceIcon,
  SearchIcon,
  XIcon,
} from "../../lib/icons";

interface FindMatch {
  startKey: NodeKey;
  startOffset: number;
  endKey: NodeKey;
  endOffset: number;
}

function sameMatches(a: FindMatch[], b: FindMatch[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.startKey !== y.startKey ||
      x.startOffset !== y.startOffset ||
      x.endKey !== y.endKey ||
      x.endOffset !== y.endOffset
    ) {
      return false;
    }
  }
  return true;
}

interface IndexItem {
  key: NodeKey;
  start: number;
  end: number;
  text: string;
}

/** Walk the editor's text nodes in document order and build a flat
 *  index. Block separators are deliberately ignored — searches treat
 *  the document as a single text stream, which avoids \n offset bugs
 *  and matches typical user expectations (find within a paragraph). */
function buildTextIndex(): IndexItem[] {
  const items: IndexItem[] = [];
  let cumulative = 0;
  function walk(node: LexicalNode) {
    if ($isTextNode(node)) {
      const text = node.getTextContent();
      items.push({
        key: node.getKey(),
        start: cumulative,
        end: cumulative + text.length,
        text,
      });
      cumulative += text.length;
    } else if ($isElementNode(node)) {
      for (const child of node.getChildren()) walk(child);
    }
  }
  walk($getRoot());
  return items;
}

function findMatchesInState(
  editor: LexicalEditor,
  query: string,
  caseSensitive: boolean,
): FindMatch[] {
  if (!query) return [];
  return editor.getEditorState().read(() => {
    const items = buildTextIndex();
    if (items.length === 0) return [];
    const concat = items.map((i) => i.text).join("");
    const haystack = caseSensitive ? concat : concat.toLowerCase();
    const needle = caseSensitive ? query : query.toLowerCase();
    if (!needle) return [];

    const matches: FindMatch[] = [];
    let from = 0;
    while (from <= haystack.length) {
      const idx = haystack.indexOf(needle, from);
      if (idx === -1) break;
      const endIdx = idx + needle.length;
      const startItem = items.find((i) => idx >= i.start && idx < i.end);
      const endItem = items.find((i) => endIdx > i.start && endIdx <= i.end);
      if (startItem && endItem) {
        matches.push({
          startKey: startItem.key,
          startOffset: idx - startItem.start,
          endKey: endItem.key,
          endOffset: endIdx - endItem.start,
        });
      }
      from = idx + Math.max(1, needle.length);
    }
    return matches;
  });
}

/** Scroll the active match's DOM element into view. We deliberately
 *  don't touch the editor selection — selection is rendered by only
 *  ONE range, while we want to highlight every match (overlay handles
 *  that). Avoiding $setSelection also avoids stealing focus from the
 *  find input. */
function scrollToMatch(editor: LexicalEditor, match: FindMatch) {
  const dom = editor.getElementByKey(match.startKey);
  dom?.scrollIntoView({ block: "center", behavior: "smooth" });
}

/** Get the first descendant Text node of an element. Lexical's
 *  TextNodes render as `<span data-lexical-text="true">text</span>`,
 *  so the wrapper's first child is the text node we need for
 *  `Range.setStart` / `setEnd` calls. */
function getDirectTextNode(el: Element): Text | null {
  for (let n = el.firstChild; n; n = n.nextSibling) {
    if (n.nodeType === Node.TEXT_NODE) return n as Text;
  }
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  return walker.nextNode() as Text | null;
}

interface RectInfo {
  top: number;
  left: number;
  width: number;
  height: number;
  active: boolean;
}

/** Render every match as a fixed-positioned overlay rectangle. Active
 *  match gets a brighter color; inactive matches get a soft yellow.
 *  Recomputes on scroll, resize, and editor updates so highlights
 *  follow the underlying text. */
function MatchHighlights({
  editor,
  matches,
  activeIdx,
}: {
  editor: LexicalEditor;
  matches: FindMatch[];
  activeIdx: number;
}) {
  const [rects, setRects] = React.useState<RectInfo[]>([]);

  React.useEffect(() => {
    if (matches.length === 0) {
      setRects([]);
      return;
    }
    const compute = () => {
      const next: RectInfo[] = [];
      matches.forEach((match, i) => {
        const startEl = editor.getElementByKey(match.startKey);
        const endEl = editor.getElementByKey(match.endKey);
        if (!startEl || !endEl) return;
        const startText = getDirectTextNode(startEl);
        const endText = getDirectTextNode(endEl);
        if (!startText || !endText) return;
        const range = document.createRange();
        try {
          range.setStart(
            startText,
            Math.min(match.startOffset, startText.length),
          );
          range.setEnd(
            endText,
            Math.min(match.endOffset, endText.length),
          );
          const cr = range.getClientRects();
          for (let j = 0; j < cr.length; j++) {
            const r = cr[j];
            if (r.width === 0 || r.height === 0) continue;
            next.push({
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
              active: i === activeIdx,
            });
          }
        } catch {
          /* range out of bounds — skip */
        }
      });
      setRects(next);
    };

    compute();

    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    const unsub = editor.registerUpdateListener(schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      unsub();
    };
  }, [editor, matches, activeIdx]);

  if (rects.length === 0 || typeof document === "undefined") return null;

  return createPortal(
    <>
      {rects.map((r, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "fixed",
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: r.active
              ? "rgba(251, 146, 60, 0.55)"
              : "rgba(254, 240, 138, 0.6)",
            borderRadius: 2,
            pointerEvents: "none",
            zIndex: 40,
            mixBlendMode: "multiply",
          }}
        />
      ))}
    </>,
    document.body,
  );
}

function replaceAtMatch(
  editor: LexicalEditor,
  match: FindMatch,
  replacement: string,
) {
  editor.update(() => {
    const startNode = $getNodeByKey(match.startKey);
    const endNode = $getNodeByKey(match.endKey);
    if (!$isTextNode(startNode) || !$isTextNode(endNode)) return;
    const sel = $createRangeSelection();
    sel.anchor.set(match.startKey, match.startOffset, "text");
    sel.focus.set(match.endKey, match.endOffset, "text");
    $setSelection(sel);
    sel.insertText(replacement);
  });
}

/**
 * Find & Replace panel — Cmd/Ctrl+F to open, Esc to close.
 *
 * Active match is highlighted via the editor's native selection (blue
 * range), other matches stay un-highlighted. Match counter shows
 * `current / total`. Enter / Shift+Enter navigates while the find input
 * is focused.
 *
 * Render inside `<RichTextEditor>` like other plugin composables:
 *
 * ```tsx
 * <RichTextEditor>
 *   <RichTextToolbar />
 *   <RichTextContent />
 *   <RichTextFindReplace />
 * </RichTextEditor>
 * ```
 */
export function RichTextFindReplace() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = React.useState(false);
  const [showReplace, setShowReplace] = React.useState(false);
  const [find, setFind] = React.useState("");
  const [replace, setReplace] = React.useState("");
  const [caseSensitive, setCaseSensitive] = React.useState(false);
  const [matches, setMatches] = React.useState<FindMatch[]>([]);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const findInputRef = React.useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+F to open (when the editor has focus or the panel is
  // already open) and Esc to close. We don't override Cmd+F globally —
  // only when the user is actually working inside this editor.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isFind =
        (e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "f";
      if (isFind) {
        const root = editor.getRootElement();
        const active = document.activeElement;
        if (root && (root.contains(active) || open)) {
          e.preventDefault();
          setOpen(true);
          requestAnimationFrame(() => findInputRef.current?.select());
        }
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor, open]);

  // Live match recomputation. On query/option change we recompute
  // immediately and select the first match (user-driven). On editor
  // updates we just refresh the count — selecting inside the listener
  // would loop because $setSelection itself triggers updates. Dedup
  // keeps the array reference stable when nothing actually changed.
  React.useEffect(() => {
    if (!open || !find) {
      setMatches([]);
      setActiveIdx(0);
      return;
    }
    const initial = findMatchesInState(editor, find, caseSensitive);
    setMatches(initial);
    setActiveIdx(0);
    if (initial.length > 0) {
      scrollToMatch(editor, initial[0]);
    }
    return editor.registerUpdateListener(() => {
      const next = findMatchesInState(editor, find, caseSensitive);
      setMatches((prev) => (sameMatches(prev, next) ? prev : next));
    });
  }, [editor, find, caseSensitive, open]);

  // Clamp activeIdx whenever the matches list shrinks.
  React.useEffect(() => {
    if (matches.length === 0) {
      setActiveIdx(0);
      return;
    }
    setActiveIdx((i) => Math.min(i, matches.length - 1));
  }, [matches.length]);

  if (!open) return null;

  const total = matches.length;

  const next = () => {
    if (total === 0) return;
    const nextIdx = (activeIdx + 1) % total;
    setActiveIdx(nextIdx);
    scrollToMatch(editor, matches[nextIdx]);
  };
  const prev = () => {
    if (total === 0) return;
    const prevIdx = (activeIdx - 1 + total) % total;
    setActiveIdx(prevIdx);
    scrollToMatch(editor, matches[prevIdx]);
  };

  const restorePanelFocus = () => {
    requestAnimationFrame(() => {
      findInputRef.current?.focus({ preventScroll: true });
    });
  };

  const replaceCurrent = () => {
    const m = matches[activeIdx];
    if (!m) return;
    replaceAtMatch(editor, m, replace);
    // Match list refreshes via the update listener; activeIdx may
    // already point at a still-valid neighbor after clamping.
    restorePanelFocus();
  };

  const replaceAll = () => {
    if (total === 0) return;
    // Iterate end → start so earlier offsets stay valid as we mutate.
    editor.update(() => {
      for (let i = total - 1; i >= 0; i--) {
        const m = matches[i];
        const startNode = $getNodeByKey(m.startKey);
        const endNode = $getNodeByKey(m.endKey);
        if (!$isTextNode(startNode) || !$isTextNode(endNode)) continue;
        const sel = $createRangeSelection();
        sel.anchor.set(m.startKey, m.startOffset, "text");
        sel.focus.set(m.endKey, m.endOffset, "text");
        $setSelection(sel);
        sel.insertText(replace);
      }
    });
    restorePanelFocus();
  };

  const noResults = find !== "" && total === 0;

  return (
    <>
      <MatchHighlights
        editor={editor}
        matches={matches}
        activeIdx={activeIdx}
      />
      <div
        role="dialog"
        aria-label="Find and replace"
        className="fixed top-4 right-4 z-50 w-[340px] rounded-lg border border-zinc-200 bg-white shadow-xl"
      >
        {/* Find row */}
        <div className="flex items-center gap-0.5 p-1.5">
          <button
            type="button"
            onClick={() => setShowReplace((s) => !s)}
            aria-pressed={showReplace}
            title={showReplace ? "Hide replace" : "Show replace"}
            className="inline-flex items-center justify-center size-7 rounded text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer transition-colors"
          >
            <ChevronDownIcon
              className={cn(
                "size-3.5 transition-transform",
                showReplace ? "" : "-rotate-90",
              )}
            />
          </button>

          <div
            className={cn(
              "flex items-center flex-1 gap-1 px-1.5 rounded border bg-white transition-colors",
              noResults
                ? "border-red-300 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-200"
                : "border-zinc-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100",
            )}
          >
            <SearchIcon className="size-3.5 text-zinc-400 shrink-0" />
            <input
              ref={findInputRef}
              type="text"
              placeholder="Find"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (e.shiftKey) prev();
                  else next();
                }
              }}
              autoFocus
              className="flex-1 min-w-0 py-1 text-sm outline-none bg-transparent placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={() => setCaseSensitive((c) => !c)}
              aria-pressed={caseSensitive}
              title="Match case"
              className={cn(
                "inline-flex items-center justify-center size-5 rounded text-[10px] font-semibold cursor-pointer transition-colors shrink-0",
                caseSensitive
                  ? "bg-blue-100 text-blue-700"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700",
              )}
            >
              Aa
            </button>
            <span
              className={cn(
                "text-[11px] tabular-nums whitespace-nowrap shrink-0 min-w-[36px] text-right",
                noResults ? "text-red-500" : "text-zinc-400",
              )}
            >
              {find === ""
                ? ""
                : total === 0
                  ? "No results"
                  : `${activeIdx + 1} of ${total}`}
            </span>
          </div>

          <ToolButton
            label="Previous match (Shift+Enter)"
            onClick={prev}
            disabled={total === 0}
          >
            <ChevronUpIcon className="size-3.5" />
          </ToolButton>
          <ToolButton
            label="Next match (Enter)"
            onClick={next}
            disabled={total === 0}
          >
            <ChevronDownIcon className="size-3.5" />
          </ToolButton>
          <span className="w-px h-4 bg-zinc-200 mx-0.5" aria-hidden="true" />
          <ToolButton label="Close (Esc)" onClick={() => setOpen(false)}>
            <XIcon className="size-3.5" />
          </ToolButton>
        </div>

        {/* Replace row */}
        {showReplace && (
          <div className="flex items-center gap-0.5 px-1.5 pb-1.5">
            <span className="size-7 shrink-0" aria-hidden="true" />
            <div className="flex items-center flex-1 px-1.5 rounded border border-zinc-200 bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-100 transition-colors">
              <ReplaceIcon className="size-3.5 text-zinc-400 shrink-0" />
              <input
                type="text"
                placeholder="Replace"
                value={replace}
                onChange={(e) => setReplace(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (e.shiftKey || e.metaKey || e.ctrlKey) replaceAll();
                    else replaceCurrent();
                  }
                }}
                className="flex-1 min-w-0 py-1 px-1.5 text-sm outline-none bg-transparent placeholder:text-zinc-400"
              />
            </div>
            <button
              type="button"
              onClick={replaceCurrent}
              disabled={total === 0}
              title="Replace current match (Enter)"
              className="px-2 h-7 text-[11px] font-medium rounded text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={replaceAll}
              disabled={total === 0}
              title="Replace all matches (⌘/Ctrl+Enter)"
              className="px-2 h-7 text-[11px] font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shrink-0"
            >
              All
            </button>
          </div>
        )}
      </div>
    </>
  );
}

RichTextFindReplace.displayName = "RichTextFindReplace";

interface ToolButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function ToolButton({ label, onClick, disabled, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex items-center justify-center size-6 rounded text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
    >
      {children}
    </button>
  );
}
