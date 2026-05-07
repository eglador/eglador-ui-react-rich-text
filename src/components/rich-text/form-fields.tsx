"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/**
 * Form field wrapper with a small uppercase label above the control.
 * Shared by every embed/edit form (YouTube, Audio, Video, ...).
 */
export function Field({ label, children }: FieldProps) {
  return (
    <div className="mb-3 last:mb-0">
      <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </span>
      {children}
    </div>
  );
}

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}

/**
 * Inline labeled checkbox. Used in option grids inside embed forms.
 */
export function Toggle({ label, checked, onChange, disabled, hint }: ToggleProps) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        disabled
          ? "text-zinc-400 cursor-not-allowed"
          : "text-zinc-700 cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
      />
      <span>{label}</span>
      {hint && (
        <span className="text-[10px] text-zinc-500 italic">({hint})</span>
      )}
    </label>
  );
}
