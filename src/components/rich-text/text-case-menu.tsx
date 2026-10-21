"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  CaseSensitiveIcon,
  CaseLowerIcon,
  CaseUpperIcon,
  CaseCapitalizeIcon,
} from "../../lib/icons";
import { useLocale, useMessages } from "./i18n";
import { transformSelectionCase, type TextCaseMode } from "./text-case";

export interface TextCaseMenuProps {
  /** Tailwind size class for the trigger button (default `size-7`). */
  sizeClass?: string;
  /** Where the menu opens relative to the trigger. */
  placement?: "bottom-start" | "bottom-center" | "top-start";
}

/**
 * `Aa` dropdown that re-cases the selected text: UPPERCASE, lowercase,
 * or Capitalize Each Word.
 *
 * Casing follows the editor's `locale`, which matters in Turkish: `i`
 * uppercases to `İ` and `I` lowercases to `ı`.
 */
export function TextCaseMenu({
  sizeClass = "size-7",
  placement = "bottom-center",
}: TextCaseMenuProps) {
  const [editor] = useLexicalComposerContext();
  const t = useMessages();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);

  const apply = (mode: TextCaseMode) => {
    transformSelectionCase(editor, mode, locale);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement={placement}
      preserveSelection
      trigger={
        <button
          type="button"
          // Keep the text selected — the transform works on it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          title={t.textCase}
          aria-label={t.textCase}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-center rounded transition-colors cursor-pointer",
            sizeClass,
            "text-zinc-700 hover:bg-zinc-100",
            open && "bg-zinc-200 text-zinc-900",
          )}
        >
          <CaseSensitiveIcon className="size-4" />
        </button>
      }
      contentClassName="w-56 rounded-lg border border-zinc-200 bg-white shadow-lg p-1"
    >
      <div role="menu" aria-label={t.textCase}>
        <TextCaseItem
          label={t.upperCase}
          icon={<CaseUpperIcon className="size-4" />}
          onClick={() => apply("upper")}
        />
        <TextCaseItem
          label={t.lowerCase}
          icon={<CaseLowerIcon className="size-4" />}
          onClick={() => apply("lower")}
        />
        <TextCaseItem
          label={t.titleCase}
          icon={<CaseCapitalizeIcon className="size-4" />}
          onClick={() => apply("title")}
        />
      </div>
    </Popover>
  );
}

TextCaseMenu.displayName = "TextCaseMenu";

function TextCaseItem({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-text-case={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm cursor-pointer text-zinc-700 hover:bg-zinc-100"
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}
