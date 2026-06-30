"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import { Field } from "./form-fields";
import type { LegacyComponentSpec } from "./legacy-schema";
import type { LegacyComponentInput } from "./legacy-shortcode";

export interface LegacyComponentFormProps {
  spec: LegacyComponentSpec;
  onSubmit: (input: LegacyComponentInput) => void;
  onCancel: () => void;
}

const inputClass =
  "w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

/**
 * Renders one input per `spec.fields` entry (text / url / number / select
 * / textarea) and builds a generic `{ type, fields }` shortcode input on
 * submit. Entirely driven by `spec` — knows nothing about what a "video"
 * or "image" component is, only the field list it's handed.
 */
export function LegacyComponentForm({
  spec,
  onSubmit,
  onCancel,
}: LegacyComponentFormProps) {
  const [values, setValues] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(
      spec.fields.map((field) => [field.name, field.options?.[0]?.value ?? ""]),
    ),
  );

  const valid = spec.fields.every(
    (field) => field.optional || values[field.name]?.trim(),
  );

  const setField = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This form is portaled to document.body, so React's synthetic submit
    // event would otherwise still bubble to a host <form> wrapping the
    // editor (React propagates along the component tree, not the DOM tree).
    e.stopPropagation();
    if (!valid) return;

    const fields: Record<string, string | number> = {};
    for (const field of spec.fields) {
      const raw = values[field.name]?.trim() ?? "";
      if (!raw && field.optional) continue;
      fields[field.name] = field.inputType === "number" ? Number(raw) || 0 : raw;
    }
    onSubmit({ type: spec.type, fields });
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3">
      <div className="mb-3 text-xs font-medium text-zinc-900">{spec.title}</div>

      {spec.fields.map((field) => (
        <Field key={field.name} label={field.label}>
          {field.inputType === "select" ? (
            <select
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              className={inputClass}
            >
              {field.optional && <option value="">—</option>}
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.inputType === "textarea" ? (
            <textarea
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={cn(inputClass, "resize-none")}
            />
          ) : (
            <input
              type={
                field.inputType === "number"
                  ? "number"
                  : field.inputType === "url"
                    ? "url"
                    : "text"
              }
              value={values[field.name] ?? ""}
              onChange={(e) => setField(field.name, e.target.value)}
              placeholder={field.placeholder}
              className={inputClass}
            />
          )}
        </Field>
      ))}

      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!valid}
          className={cn(
            "px-3 py-1.5 text-xs rounded text-white cursor-pointer",
            "bg-blue-600 hover:bg-blue-700",
            "disabled:bg-zinc-300 disabled:cursor-not-allowed",
          )}
        >
          Embed
        </button>
      </div>
    </form>
  );
}

LegacyComponentForm.displayName = "LegacyComponentForm";
