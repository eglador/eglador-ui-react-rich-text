"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import { cn } from "../../lib/utils";
import { Popover } from "../../lib/popover";
import {
  CaseSensitiveIcon,
  CaseLowerIcon,
  CaseUpperIcon,
  CaseCapitalizeIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  HighlighterIcon,
} from "../../lib/icons";
import { useLocale, useMessages } from "./i18n";
import { transformSelectionCase, type TextCaseMode } from "./text-case";

interface TextTransformMenuProps {
  /** Tailwind size class for the trigger button (default `size-8`) */
  sizeClass?: string;
  /** Active inline-format states (passed by toolbar) */
  active?: {
    strikethrough?: boolean;
    subscript?: boolean;
    superscript?: boolean;
    highlight?: boolean;
  };
}

/**
 * Aa dropdown — text transformations (case mutation) plus advanced inline
 * formats. Case items (Lowercase / Uppercase / Capitalize) mutate the
 * underlying text via Lexical's TextNode API; format items
 * (Strikethrough / Subscript / Superscript / Highlight) toggle via the
 * standard `FORMAT_TEXT_COMMAND`.
 */
export function TextTransformMenu({
  sizeClass = "size-8",
  active = {},
}: TextTransformMenuProps) {
  const [editor] = useLexicalComposerContext();
  const t = useMessages();
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);

  const transformCase = React.useCallback(
    (mode: TextCaseMode) => {
      transformSelectionCase(editor, mode, locale);
      setOpen(false);
    },
    [editor, locale],
  );

  const dispatchFormat = React.useCallback(
    (
      format:
        | "strikethrough"
        | "subscript"
        | "superscript"
        | "highlight",
    ) => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      setOpen(false);
    },
    [editor],
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottom-start"
      preserveSelection
      trigger={
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          title={t.textCase}
          aria-label="Text transform"
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "inline-flex items-center justify-center rounded transition-colors cursor-pointer",
            sizeClass,
            "text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900",
            open && "bg-zinc-200 text-zinc-900",
          )}
        >
          <CaseSensitiveIcon className="size-4" />
        </button>
      }
      contentClassName="w-52 rounded-lg border border-zinc-200 bg-white shadow-lg p-1"
    >
      <MenuItem
        label={t.lowerCase}
        icon={<CaseLowerIcon className="size-4" />}
        onClick={() => transformCase("lower")}
      />
      <MenuItem
        label={t.upperCase}
        icon={<CaseUpperIcon className="size-4" />}
        onClick={() => transformCase("upper")}
      />
      <MenuItem
        label={t.titleCase}
        icon={<CaseCapitalizeIcon className="size-4" />}
        onClick={() => transformCase("title")}
      />
      <Divider />
      <MenuItem
        label="Strikethrough"
        icon={<StrikethroughIcon className="size-4" />}
        active={active.strikethrough}
        onClick={() => dispatchFormat("strikethrough")}
      />
      <MenuItem
        label="Subscript"
        icon={<SubscriptIcon className="size-4" />}
        active={active.subscript}
        onClick={() => dispatchFormat("subscript")}
      />
      <MenuItem
        label="Superscript"
        icon={<SuperscriptIcon className="size-4" />}
        active={active.superscript}
        onClick={() => dispatchFormat("superscript")}
      />
      <MenuItem
        label="Highlight"
        icon={<HighlighterIcon className="size-4" />}
        active={active.highlight}
        onClick={() => dispatchFormat("highlight")}
      />
    </Popover>
  );
}

TextTransformMenu.displayName = "TextTransformMenu";

interface MenuItemProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

function MenuItem({ label, icon, onClick, active }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm cursor-pointer",
        active
          ? "bg-zinc-100 text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100",
      )}
    >
      <span className="text-zinc-500">{icon}</span>
      {label}
    </button>
  );
}

function Divider() {
  return <div className="h-px bg-zinc-200 my-1" />;
}
