"use client";

import * as React from "react";
import { Popover, type PopoverPlacement } from "../../lib/popover";
import { LinkEditForm } from "./link-edit-form";

interface LinkEditPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  placement?: PopoverPlacement;
}

/**
 * Thin Popover wrapper around `LinkEditForm` for toolbar buttons.
 *
 * Note: this popover is NOT marked `preserveSelection` because the form
 * inputs need keyboard focus. Lexical retains its RangeSelection while
 * focus is outside the editor root, so dispatching the command on submit
 * applies to the original text selection.
 */
export function LinkEditPopover({
  open,
  onOpenChange,
  trigger,
  placement = "bottom-start",
}: LinkEditPopoverProps) {
  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
      placement={placement}
      trigger={trigger}
      contentClassName="rounded-lg border border-zinc-200 bg-white shadow-lg p-3 w-80"
    >
      <LinkEditForm
        autoFocusUrl
        showCancel
        onClose={() => onOpenChange(false)}
      />
    </Popover>
  );
}

LinkEditPopover.displayName = "LinkEditPopover";
