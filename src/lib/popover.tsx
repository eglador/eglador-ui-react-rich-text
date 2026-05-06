"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";

export type PopoverPlacement =
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"
  | "top-start"
  | "top-center"
  | "top-end";

export interface PopoverProps {
  /** Anchor element (rendered as-is, wrapped in an inline-flex div for ref tracking) */
  trigger: React.ReactNode;
  /** Floating popover content */
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preferred placement; auto-flips vertically and auto-shifts horizontally to stay in viewport */
  placement?: PopoverPlacement;
  /** Gap between trigger and popover, in px (default `4`) */
  offset?: number;
  /** Padding from viewport edges when shifting, in px (default `8`) */
  viewportPadding?: number;
  /** Apply `onMouseDown` preventDefault on popover content to preserve underlying editor selection */
  preserveSelection?: boolean;
  /** Class for the wrapping anchor div (around `trigger`) */
  triggerClassName?: string;
  /** Class for the floating content element */
  contentClassName?: string;
}

const DEFAULT_OFFSET = 4;
const DEFAULT_VIEWPORT_PADDING = 8;

/**
 * Portal-rendered popover with viewport-aware positioning.
 *
 * Uses `position: fixed` rendered into `document.body`, so it never gets
 * clipped by ancestor `overflow: hidden`. Auto-flips top/bottom and
 * auto-shifts horizontally when the popover would overflow the viewport.
 *
 * The trigger is wrapped in a tracking `<div>`; click/keyboard handling
 * (toggle, Escape, outside-click) is handled here.
 */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  placement = "bottom-start",
  offset = DEFAULT_OFFSET,
  viewportPadding = DEFAULT_VIEWPORT_PADDING,
  preserveSelection = false,
  triggerClassName,
  contentClassName,
}: PopoverProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState<{
    top: number;
    left: number;
  } | null>(null);

  const updatePosition = React.useCallback(() => {
    const triggerEl = triggerRef.current;
    const contentEl = contentRef.current;
    if (!triggerEl || !contentEl) return;

    const tr = triggerEl.getBoundingClientRect();
    // Skip when the trigger is hidden (display:none / detached). Otherwise
    // getBoundingClientRect collapses to (0,0,0,0) and the popover snaps to
    // the viewport top-left. This happens with Lexical's draggable block
    // menu, which toggles display:none when the cursor leaves the block.
    if (tr.width === 0 && tr.height === 0) return;

    const cw = contentEl.offsetWidth;
    const ch = contentEl.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const [sideRaw, alignRaw] = placement.split("-") as [
      "top" | "bottom",
      "start" | "center" | "end",
    ];

    // Flip vertical side if there is more room on the opposite side
    let side: "top" | "bottom" = sideRaw;
    const spaceBelow = vh - tr.bottom - viewportPadding;
    const spaceAbove = tr.top - viewportPadding;
    if (
      sideRaw === "bottom" &&
      ch + offset > spaceBelow &&
      spaceAbove > spaceBelow
    ) {
      side = "top";
    } else if (
      sideRaw === "top" &&
      ch + offset > spaceAbove &&
      spaceBelow > spaceAbove
    ) {
      side = "bottom";
    }

    const top = side === "bottom" ? tr.bottom + offset : tr.top - ch - offset;

    let left: number;
    if (alignRaw === "start") {
      left = tr.left;
    } else if (alignRaw === "end") {
      left = tr.right - cw;
    } else {
      left = tr.left + tr.width / 2 - cw / 2;
    }

    if (left + cw > vw - viewportPadding) {
      left = vw - cw - viewportPadding;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }

    setPosition({ top, left });
  }, [placement, offset, viewportPadding]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const handle = () => updatePosition();

    // ResizeObserver covers content size changes (e.g. sub-views inside the
    // popover swapping content). Without this, sub-view popovers stay anchored
    // at the previous size's coordinates and can drift off the trigger.
    //
    // We deliberately *don't* observe the trigger: triggers rarely resize,
    // and observing them causes false-positive updates when an ancestor toggles
    // display:none (e.g. Lexical's draggable block menu hiding off-hover) —
    // the trigger reports 0×0 and the popover would jump to (0,0).
    const ro = new ResizeObserver(() => updatePosition());
    if (contentRef.current) ro.observe(contentRef.current);

    window.addEventListener("resize", handle);
    // capture=true so we catch scrolls in any nested scroll container
    window.addEventListener("scroll", handle, true);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
    };
  }, [open, updatePosition]);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (
        !triggerRef.current?.contains(t) &&
        !contentRef.current?.contains(t)
      ) {
        onOpenChange(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onOpenChange]);

  return (
    <>
      <div ref={triggerRef} className={cn("inline-flex", triggerClassName)}>
        {trigger}
      </div>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={contentRef}
            role="presentation"
            onMouseDown={
              preserveSelection ? (e) => e.preventDefault() : undefined
            }
            className={cn("fixed z-[9999]", contentClassName)}
            style={
              position
                ? { top: position.top, left: position.left }
                : { top: 0, left: 0, visibility: "hidden" }
            }
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}

Popover.displayName = "Popover";
