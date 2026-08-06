"use client";

import * as React from "react";
import { cn } from "../../../lib/utils";
import { SettingsIcon } from "../../../lib/icons";
import { Popover } from "../../../lib/popover";
import { CmsForm } from "./cms-form";
import type { CmsBlockSpec, CmsFieldValues } from "./cms-types";

export interface CmsBlockProps {
  spec: CmsBlockSpec;
  fields: CmsFieldValues;
  onSave: (values: CmsFieldValues) => void;
  onRemove: () => void;
}

/**
 * In-editor rendering for a CMS block: the spec's custom preview (or a
 * generic field-summary card) plus a hover gear that opens the same
 * form used to insert it. Purely presentational — the owning node wires
 * `onSave` / `onRemove`, which keeps this module free of any import
 * back into the node factory.
 */
export function CmsBlock({ spec, fields, onSave, onRemove }: CmsBlockProps) {
  const [open, setOpen] = React.useState(false);

  const handleSave = (values: CmsFieldValues) => {
    onSave(values);
    setOpen(false);
  };

  const handleRemove = () => {
    onRemove();
    setOpen(false);
  };

  return (
    <div className="relative group">
      {spec.renderPreview ? (
        spec.renderPreview(fields)
      ) : (
        <GenericCmsCard spec={spec} fields={fields} />
      )}

      <Popover
        open={open}
        onOpenChange={setOpen}
        placement="bottom-end"
        triggerClassName={cn(
          "absolute top-2 right-2 z-10 transition-opacity",
          open ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        trigger={
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title={`${spec.title} ayarları`}
            aria-label={`${spec.title} bileşenini düzenle`}
            className="inline-flex items-center justify-center size-8 rounded-md bg-white/95 backdrop-blur-sm shadow-md text-zinc-700 hover:bg-white hover:text-zinc-900 cursor-pointer border border-zinc-200"
          >
            <SettingsIcon className="size-4" />
          </button>
        }
        contentClassName="rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden"
      >
        <CmsForm
          spec={spec}
          mode="edit"
          initialValues={fields}
          onSubmit={handleSave}
          onCancel={() => setOpen(false)}
          onRemove={handleRemove}
        />
      </Popover>
    </div>
  );
}

CmsBlock.displayName = "CmsBlock";

interface GenericCmsCardProps {
  spec: CmsBlockSpec;
  fields: CmsFieldValues;
}

/**
 * Fallback preview for types that have no visual representation (widget
 * placeholders like `piyasa`, `havadurumu`, ...). Shows what the block
 * is and the values it will render with, so the document stays
 * scannable without the CMS actually rendering the widget.
 */
function GenericCmsCard({ spec, fields }: GenericCmsCardProps) {
  const entries = spec.fields
    .map((field) => [field, fields[field.name]] as const)
    .filter(([, value]) => Boolean(value?.trim()));

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 pr-12">
      <div className="flex items-center gap-2 text-xs font-medium text-zinc-700">
        <span className="text-zinc-500 shrink-0">{spec.icon}</span>
        <span className="truncate">{spec.title}</span>
        <code className="ml-auto text-[10px] font-mono text-zinc-400 shrink-0">
          {spec.type}
        </code>
      </div>

      {entries.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
          {entries.map(([field, value]) => (
            <React.Fragment key={field.name}>
              <dt className="text-zinc-500 truncate">{field.label}</dt>
              <dd className="font-mono text-zinc-700 truncate">{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      )}
    </div>
  );
}
