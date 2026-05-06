"use client";

import { cn } from "../../lib/utils";

interface CharacterCountProps {
  /** Remaining characters (negative when over the limit) */
  remaining: number;
  /** The configured `maxLength` */
  max: number;
}

/**
 * Twitter-style character counter — circular progress + numeric pill,
 * absolutely positioned at the editor's bottom-right corner. Color
 * transitions: zinc → amber when ≤10% remaining → red when over.
 */
export function CharacterCount({ remaining, max }: CharacterCountProps) {
  const used = Math.max(0, max - remaining);
  const percent = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const isOver = remaining < 0;
  const isWarning = !isOver && remaining <= max * 0.1;

  const state: "over" | "warning" | "normal" = isOver
    ? "over"
    : isWarning
      ? "warning"
      : "normal";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${used} of ${max} characters used`}
      className={cn(
        "absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "border bg-white/85 backdrop-blur-sm shadow-sm pointer-events-none transition-colors",
        state === "normal" && "border-zinc-200",
        state === "warning" && "border-amber-300 bg-amber-50/85",
        state === "over" && "border-red-300 bg-red-50/85",
      )}
    >
      <CircularProgress percent={isOver ? 100 : percent} state={state} />
      <span
        className={cn(
          "text-xs font-mono tabular-nums leading-none",
          state === "normal" && "text-zinc-600",
          state === "warning" && "text-amber-700 font-medium",
          state === "over" && "text-red-700 font-semibold",
        )}
      >
        {isOver ? remaining : `${used} / ${max}`}
      </span>
    </div>
  );
}

CharacterCount.displayName = "CharacterCount";

interface CircularProgressProps {
  percent: number;
  state: "over" | "warning" | "normal";
}

function CircularProgress({ percent, state }: CircularProgressProps) {
  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="-ml-0.5 shrink-0"
    >
      <circle
        cx="8"
        cy="8"
        r={radius}
        className={cn(
          state === "normal" && "stroke-zinc-200",
          state === "warning" && "stroke-amber-200",
          state === "over" && "stroke-red-200",
        )}
        strokeWidth="1.5"
        fill="none"
      />
      <circle
        cx="8"
        cy="8"
        r={radius}
        className={cn(
          state === "normal" && "stroke-blue-500",
          state === "warning" && "stroke-amber-500",
          state === "over" && "stroke-red-500",
        )}
        strokeWidth="1.5"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 8 8)"
        style={{ transition: "stroke-dashoffset 200ms ease" }}
      />
    </svg>
  );
}
