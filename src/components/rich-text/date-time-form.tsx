"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

export type DateTimeFormat =
  | "short-date"
  | "long-date"
  | "time"
  | "datetime"
  | "iso";

interface FormatOption {
  key: DateTimeFormat;
  label: string;
  format: (d: Date) => string;
}

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

const LONG_DATE_OPTS: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};

export const DATE_TIME_FORMATS: FormatOption[] = [
  {
    key: "short-date",
    label: "Date (short)",
    format: (d) => d.toISOString().slice(0, 10),
  },
  {
    key: "long-date",
    label: "Date (long)",
    format: (d) => d.toLocaleDateString(undefined, LONG_DATE_OPTS),
  },
  {
    key: "time",
    label: "Time",
    format: (d) => d.toLocaleTimeString(undefined, TIME_OPTS),
  },
  {
    key: "datetime",
    label: "Date + time",
    format: (d) =>
      `${d.toISOString().slice(0, 10)} ${d.toLocaleTimeString(undefined, TIME_OPTS)}`,
  },
  {
    key: "iso",
    label: "ISO 8601",
    format: (d) => d.toISOString(),
  },
];

export const DATE_TIME_DEFAULT_FORMAT: DateTimeFormat = "datetime";

/** Format the current date/time according to one of the preset
 *  options. Used both by the form and by the registry's quick `action`. */
export function formatDateTime(
  format: DateTimeFormat = DATE_TIME_DEFAULT_FORMAT,
  date: Date = new Date(),
): string {
  const opt =
    DATE_TIME_FORMATS.find((o) => o.key === format) ?? DATE_TIME_FORMATS[3];
  return opt.format(date);
}

interface DateTimeFormProps {
  /** Initial format selection (default `"datetime"`). */
  initialFormat?: DateTimeFormat;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

/**
 * Format picker for the Date / Time block. Live-previews the formatted
 * string so users see exactly what gets inserted before they commit.
 */
export function DateTimeForm({
  initialFormat = DATE_TIME_DEFAULT_FORMAT,
  onSubmit,
  onCancel,
}: DateTimeFormProps) {
  const [format, setFormat] = React.useState<DateTimeFormat>(initialFormat);
  const [now, setNow] = React.useState(() => new Date());

  // Refresh the preview every 30s so "Time" / "Date + time" stay current
  // while the form is open. Cheap — only ticks while mounted.
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const preview = formatDateTime(format, now);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(preview);
      }}
      className="w-72 p-3"
    >
      <div className="flex flex-col gap-1.5 mb-3">
        {DATE_TIME_FORMATS.map((opt) => {
          const selected = opt.key === format;
          return (
            <label
              key={opt.key}
              className={cn(
                "flex items-center justify-between gap-2 px-2 py-1.5 rounded text-sm cursor-pointer border transition-colors",
                selected
                  ? "border-blue-500 bg-blue-50 text-zinc-900"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700",
              )}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="format"
                  value={opt.key}
                  checked={selected}
                  onChange={() => setFormat(opt.key)}
                  className="size-3.5 accent-blue-600"
                />
                <span className="font-medium">{opt.label}</span>
              </span>
              <span className="text-xs text-zinc-500 tabular-nums truncate">
                {opt.format(now)}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium rounded text-zinc-600 hover:bg-zinc-100 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
        >
          Insert
        </button>
      </div>
    </form>
  );
}

DateTimeForm.displayName = "DateTimeForm";
