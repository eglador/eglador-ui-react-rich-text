"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import type { TextNode } from "lexical";
import { cn } from "../../lib/utils";
import {
  type BlockSpec,
  defaultBlocks,
  getBlocksForSurface,
} from "./blocks-registry";

class SlashCommandOption extends MenuOption {
  constructor(public readonly spec: BlockSpec) {
    super(spec.key);
  }
}

interface RichTextSlashCommandsProps {
  /**
   * Custom blocks registry. Defaults to the built-in `defaultBlocks` —
   * filtered to entries with `surfaces.includes("slash")`. Pass your own
   * list to extend / re-order / restrict.
   */
  blocks?: BlockSpec[];
}

/** Position of the slash trigger when the form popover opens —
 *  used to anchor the form near the cursor. */
interface FormAnchor {
  top: number;
  left: number;
}

/**
 * Slash command menu — type `/` in the editor to open a popover with quick
 * block insertions (Notion / Linear / Discord pattern).
 *
 * - `action`-based blocks run immediately on select (paragraph, heading,
 *   list, divider, ...).
 * - `renderForm`-only blocks (YouTube, image, iframe, columns, ...) open
 *   a small form popover anchored near the cursor on select; submit
 *   inserts the block, cancel just dismisses.
 */
export function RichTextSlashCommands({
  blocks = defaultBlocks,
}: RichTextSlashCommandsProps = {}) {
  const [editor] = useLexicalComposerContext();
  const [queryString, setQueryString] = React.useState<string | null>(null);
  const [pendingSpec, setPendingSpec] = React.useState<BlockSpec | null>(null);
  const [formAnchor, setFormAnchor] = React.useState<FormAnchor | null>(null);

  const allOptions = React.useMemo(
    () =>
      getBlocksForSurface("slash", blocks).map(
        (spec) => new SlashCommandOption(spec),
      ),
    [blocks],
  );

  const options = React.useMemo(() => {
    if (!queryString) return allOptions;
    const lower = queryString.toLowerCase();
    return allOptions.filter((o) => {
      if (o.spec.label.toLowerCase().includes(lower)) return true;
      return (o.spec.keywords ?? []).some((k) =>
        k.toLowerCase().includes(lower),
      );
    });
  }, [queryString, allOptions]);

  const triggerFn = useBasicTypeaheadTriggerMatch("/", { minLength: 0 });

  const closeForm = React.useCallback(() => {
    setPendingSpec(null);
    setFormAnchor(null);
  }, []);

  const onSelectOption = React.useCallback(
    (
      selected: SlashCommandOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        nodeToRemove?.remove();
      });

      const spec = selected.spec;
      // Quick action wins when both exist (slash favors speed; the
      // toolbar Insert dropdown gets the form).
      if (typeof spec.action === "function") {
        spec.action(editor);
        closeMenu();
        return;
      }

      if (typeof spec.renderForm === "function") {
        const anchor = getCaretAnchor();
        setFormAnchor(anchor);
        setPendingSpec(spec);
      }
      closeMenu();
    },
    [editor],
  );

  return (
    <>
      <LexicalTypeaheadMenuPlugin<SlashCommandOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={triggerFn}
        options={options}
        menuRenderFn={(anchorElementRef, itemProps) => {
          const {
            selectedIndex,
            selectOptionAndCleanUp,
            setHighlightedIndex,
          } = itemProps;
          if (!anchorElementRef.current || options.length === 0) return null;

          return createPortal(
            <div
              role="menu"
              aria-label="Slash commands"
              className="absolute z-[9999] w-72 rounded-lg border border-zinc-200 bg-white shadow-xl p-1 max-h-80 overflow-y-auto"
            >
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-500 border-b border-zinc-100 mb-1">
                Insert block
              </div>
              {options.map((option, i) => (
                <button
                  key={option.key}
                  type="button"
                  role="menuitem"
                  ref={option.setRefElement}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setHighlightedIndex(i);
                    selectOptionAndCleanUp(option);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={cn(
                    "flex items-center gap-3 w-full px-2 py-1.5 rounded text-sm cursor-pointer",
                    selectedIndex === i
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50",
                  )}
                >
                  <span className="inline-flex items-center justify-center size-8 rounded border border-zinc-200 bg-white text-zinc-600 shrink-0">
                    {option.spec.icon}
                  </span>
                  <span className="flex flex-col items-start min-w-0">
                    <span className="font-medium truncate">
                      {option.spec.label}
                    </span>
                    {option.spec.description && (
                      <span className="text-xs text-zinc-500 truncate">
                        {option.spec.description}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>,
            anchorElementRef.current,
          );
        }}
      />

      {pendingSpec && pendingSpec.renderForm && formAnchor &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998]"
              onMouseDown={(e) => {
                e.preventDefault();
                closeForm();
              }}
            />
            <div
              role="dialog"
              aria-label={`Insert ${pendingSpec.label}`}
              className="fixed z-[9999] rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
              style={{ top: formAnchor.top, left: formAnchor.left }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {pendingSpec.renderForm(editor, {
                onComplete: closeForm,
                onCancel: closeForm,
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

RichTextSlashCommands.displayName = "RichTextSlashCommands";

/** Read the live caret bounding rect — the form popover anchors below it
 *  so it visually replaces the slash menu in the same spot. Falls back to
 *  the active element's rect if no selection is present. */
function getCaretAnchor(): FormAnchor {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0).cloneRange();
    const rects = range.getClientRects();
    const rect =
      rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
    if (rect && (rect.top !== 0 || rect.left !== 0)) {
      return { top: rect.bottom + 4, left: rect.left };
    }
  }
  const active = document.activeElement as HTMLElement | null;
  if (active) {
    const r = active.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  }
  return { top: 100, left: 100 };
}
