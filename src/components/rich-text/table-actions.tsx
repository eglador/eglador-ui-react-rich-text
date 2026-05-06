"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  $isTableCellNode,
  $isTableSelection,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $mergeCells,
  $unmergeCell,
  type TableCellNode,
} from "@lexical/table";
import { mergeRegister } from "@lexical/utils";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  ChevronDownIcon,
  RowInsertTopIcon,
  RowInsertBottomIcon,
  ColumnInsertLeftIcon,
  ColumnInsertRightIcon,
  RowRemoveIcon,
  ColumnRemoveIcon,
  TrashIcon,
  MergeIcon,
  SplitIcon,
} from "../../lib/icons";

interface RichTextTableActionsProps {
  /** Element used as positioning anchor (typically the editor's content wrapper) */
  anchorElem: HTMLElement;
}

type ActiveCell = {
  cellKey: string;
  /** Top offset relative to anchor element */
  top: number;
  /** Right offset relative to anchor element */
  right: number;
};

/**
 * Floating chevron button anchored to the active table cell. Click opens a
 * menu with structural operations (insert / delete row & column, merge,
 * unmerge, delete table). Operations use Lexical's official `@lexical/table`
 * helpers so they respect cell merge state and selection semantics.
 */
export function RichTextTableActions({
  anchorElem,
}: RichTextTableActionsProps) {
  const [editor] = useLexicalComposerContext();
  const [activeCell, setActiveCell] = React.useState<ActiveCell | null>(null);
  const [hasMultiSelection, setHasMultiSelection] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const updateActiveCell = React.useCallback(() => {
    editor.read(() => {
      const selection = $getSelection();
      let cellNode: TableCellNode | null = null;
      let isMulti = false;
      if ($isRangeSelection(selection)) {
        cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
      } else if ($isTableSelection(selection)) {
        const cells = selection
          .getNodes()
          .filter($isTableCellNode) as TableCellNode[];
        cellNode = cells[0] ?? null;
        isMulti = cells.length > 1;
      }

      if (!cellNode) {
        setActiveCell(null);
        setHasMultiSelection(false);
        return;
      }

      const cellElement = editor.getElementByKey(cellNode.getKey());
      if (!cellElement) {
        setActiveCell(null);
        setHasMultiSelection(false);
        return;
      }

      const cellRect = cellElement.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      setActiveCell({
        cellKey: cellNode.getKey(),
        top: cellRect.top - anchorRect.top + 4,
        right: anchorRect.right - cellRect.right + 4,
      });
      setHasMultiSelection(isMulti);
    });
  }, [editor, anchorElem]);

  React.useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => updateActiveCell()),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateActiveCell();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateActiveCell]);

  React.useEffect(() => {
    const handler = () => updateActiveCell();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [updateActiveCell]);

  // Close popover when active cell changes (cursor moved to a different cell)
  React.useEffect(() => {
    setOpen(false);
  }, [activeCell?.cellKey]);

  const handle = React.useCallback(
    (action: () => void) => {
      editor.update(() => action());
      setOpen(false);
    },
    [editor],
  );

  if (!activeCell) return null;

  return createPortal(
    <div
      className="absolute z-30"
      style={{ top: activeCell.top, right: activeCell.right }}
    >
      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
        preserveSelection
        trigger={
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setOpen((o) => !o)}
            title="Table actions"
            aria-label="Table actions"
            aria-haspopup="menu"
            aria-expanded={open}
            className="inline-flex items-center justify-center size-5 rounded bg-white border border-zinc-300 text-zinc-600 hover:bg-zinc-100 cursor-pointer shadow-sm"
          >
            <ChevronDownIcon className="size-3" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-lg p-1 w-52"
      >
        <ActionItem
          label="Insert row above"
          icon={<RowInsertTopIcon className="size-4" />}
          onClick={() =>
            handle(() => {
              $insertTableRow__EXPERIMENTAL(false);
            })
          }
        />
        <ActionItem
          label="Insert row below"
          icon={<RowInsertBottomIcon className="size-4" />}
          onClick={() =>
            handle(() => {
              $insertTableRow__EXPERIMENTAL(true);
            })
          }
        />
        <ActionItem
          label="Insert column left"
          icon={<ColumnInsertLeftIcon className="size-4" />}
          onClick={() =>
            handle(() => {
              $insertTableColumn__EXPERIMENTAL(false);
            })
          }
        />
        <ActionItem
          label="Insert column right"
          icon={<ColumnInsertRightIcon className="size-4" />}
          onClick={() =>
            handle(() => {
              $insertTableColumn__EXPERIMENTAL(true);
            })
          }
        />
        <Divider />
        {hasMultiSelection && (
          <>
            <ActionItem
              label="Merge cells"
              icon={<MergeIcon className="size-4" />}
              onClick={() =>
                handle(() => {
                  const sel = $getSelection();
                  if (!$isTableSelection(sel)) return;
                  const cells = sel
                    .getNodes()
                    .filter($isTableCellNode) as TableCellNode[];
                  if (cells.length > 1) $mergeCells(cells);
                })
              }
            />
            <Divider />
          </>
        )}
        <ActionItem
          label="Unmerge cell"
          icon={<SplitIcon className="size-4" />}
          onClick={() =>
            handle(() => {
              $unmergeCell();
            })
          }
        />
        <Divider />
        <ActionItem
          label="Delete row"
          icon={<RowRemoveIcon className="size-4" />}
          variant="danger"
          onClick={() =>
            handle(() => {
              $deleteTableRow__EXPERIMENTAL();
            })
          }
        />
        <ActionItem
          label="Delete column"
          icon={<ColumnRemoveIcon className="size-4" />}
          variant="danger"
          onClick={() =>
            handle(() => {
              $deleteTableColumn__EXPERIMENTAL();
            })
          }
        />
        <ActionItem
          label="Delete table"
          icon={<TrashIcon className="size-4" />}
          variant="danger"
          onClick={() =>
            handle(() => {
              const sel = $getSelection();
              const node = $isRangeSelection(sel)
                ? sel.anchor.getNode()
                : null;
              if (!node) return;
              const cellNode = $getTableCellNodeFromLexicalNode(node);
              if (!cellNode) return;
              const tableNode = $getTableNodeFromLexicalNodeOrThrow(cellNode);
              tableNode.remove();
            })
          }
        />
      </Popover>
    </div>,
    anchorElem,
  );
}

RichTextTableActions.displayName = "RichTextTableActions";

interface ActionItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

function ActionItem({
  label,
  icon,
  onClick,
  variant = "default",
}: ActionItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm cursor-pointer",
        variant === "default" && "text-zinc-700 hover:bg-zinc-100",
        variant === "danger" && "text-red-600 hover:bg-red-50",
      )}
    >
      <span
        className={cn(
          variant === "default" ? "text-zinc-500" : "text-red-500",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-200 my-1" />;
}
