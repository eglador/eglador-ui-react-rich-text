"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { TrashIcon } from "../../../lib/icons";
import { Field } from "../form-fields";
import { MediaThumb, parseIdList } from "./cms-previews";
import type { CmsBlockSpec, CmsFieldSpec, CmsFieldValues } from "./cms-types";

const INPUT_CLASS =
  "w-full px-2 py-1.5 text-sm border border-zinc-300 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

/** Seed values for a brand-new block: selects default to their first
 *  option (so a required select is never submitted empty), everything
 *  else starts blank. */
export function initialCmsValues(spec: CmsBlockSpec): CmsFieldValues {
  return Object.fromEntries(
    spec.fields.map((field) => [
      field.name,
      field.inputType === "select" && !field.optional
        ? (field.options?.[0]?.value ?? "")
        : "",
    ]),
  );
}

export interface CmsFormProps {
  spec: CmsBlockSpec;
  /** `"insert"` for a new block, `"edit"` for an existing one. */
  mode: "insert" | "edit";
  initialValues?: CmsFieldValues;
  onSubmit: (values: CmsFieldValues) => void;
  onCancel: () => void;
  /** Only rendered in `"edit"` mode. */
  onRemove?: () => void;
}

/**
 * Builds a form from a `CmsBlockSpec`'s field list. Shared by both the
 * insert surfaces (toolbar "+" / slash) and the per-block edit popover,
 * mirroring the single-schema-two-modes pattern the built-in media
 * forms use (see `youtube-form.tsx`).
 */
export function CmsForm({
  spec,
  mode,
  initialValues,
  onSubmit,
  onCancel,
  onRemove,
}: CmsFormProps) {
  const [values, setValues] = React.useState<CmsFieldValues>(
    () => initialValues ?? initialCmsValues(spec),
  );

  const valid = spec.fields.every(
    (field) => field.optional || values[field.name]?.trim(),
  );

  const setField = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The insert surfaces portal this form to document.body, but React
    // propagates synthetic events along the component tree — without
    // this, submit would bubble into a host <form> wrapping the editor.
    e.stopPropagation();
    if (!valid) return;

    const next: CmsFieldValues = {};
    for (const field of spec.fields) {
      const raw = values[field.name]?.trim() ?? "";
      if (!raw && field.optional) continue;
      next[field.name] = raw;
    }
    onSubmit(next);
  };

  return (
    <form onSubmit={handleSubmit} className="w-80 p-3 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900">
          <span className="text-zinc-700">{spec.icon}</span>
          {spec.title}
        </div>
        {mode === "edit" && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline cursor-pointer"
          >
            <TrashIcon className="size-3.5" />
            Sil
          </button>
        )}
      </div>

      {spec.fields.map((field, index) => (
        <Field
          key={field.name}
          label={field.optional ? `${field.label} (opsiyonel)` : field.label}
        >
          <CmsFieldInput
            field={field}
            value={values[field.name] ?? ""}
            onChange={(value) => setField(field.name, value)}
            autoFocus={mode === "insert" && index === 0}
          />
        </Field>
      ))}

      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-zinc-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-50 cursor-pointer"
        >
          Vazgeç
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
          {mode === "insert" ? "Ekle" : "Kaydet"}
        </button>
      </div>
    </form>
  );
}

CmsForm.displayName = "CmsForm";

interface CmsFieldInputProps {
  field: CmsFieldSpec;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

function CmsFieldInput({
  field,
  value,
  onChange,
  autoFocus,
}: CmsFieldInputProps) {
  switch (field.inputType) {
    case "select":
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(INPUT_CLASS, "bg-white cursor-pointer")}
        >
          {field.optional && <option value="">—</option>}
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case "textarea":
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          className={cn(INPUT_CLASS, "resize-y")}
        />
      );

    case "image-ids":
      return <ImageIdsInput field={field} value={value} onChange={onChange} />;

    default:
      return (
        <input
          type={
            field.inputType === "number"
              ? "number"
              : field.inputType === "url"
                ? "url"
                : field.inputType === "date"
                  ? "date"
                  : field.inputType === "time"
                    ? "time"
                    : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          className={INPUT_CLASS}
        />
      );
  }
}

/** Comma-separated media IDs with a live thumbnail strip, so the author
 *  can confirm each ID resolves before saving. */
function ImageIdsInput({
  field,
  value,
  onChange,
}: Omit<CmsFieldInputProps, "autoFocus">) {
  const ids = parseIdList(value);

  const removeId = (target: string) =>
    onChange(ids.filter((id) => id !== target).join(", "));

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? "345456, 345457"}
        className={INPUT_CLASS}
      />
      <p className="mt-1 text-[10px] text-zinc-500">
        Virgülle ayırarak birden fazla resim ID’si girebilirsin.
      </p>
      {ids.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ids.map((id) => (
            <div key={id} className="relative group/thumb">
              <div className="size-14 overflow-hidden rounded border border-zinc-200">
                <MediaThumb id={id} />
              </div>
              <button
                type="button"
                onClick={() => removeId(id)}
                aria-label={`${id} numaralı resmi kaldır`}
                className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center size-4 rounded-full bg-white border border-zinc-300 text-zinc-500 opacity-0 group-hover/thumb:opacity-100 hover:text-red-600 hover:border-red-300 cursor-pointer transition-opacity"
              >
                <TrashIcon className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
