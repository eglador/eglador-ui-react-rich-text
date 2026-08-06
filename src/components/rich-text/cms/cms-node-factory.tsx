"use client";

import * as React from "react";
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents";
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getNodeByKey,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type Klass,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
} from "lexical";
import { CmsBlock } from "./cms-block";
import type { CmsBlockSpec, CmsFieldValues } from "./cms-types";

/** Lexical's own block keys plus one top-level key per spec field. */
export type SerializedCmsBlockNode = SerializedDecoratorBlockNode & {
  [field: string]: unknown;
};

/**
 * Keys owned by Lexical's own serialization. A spec field must never
 * overwrite one of these, or the node would fail to round-trip.
 */
const RESERVED_KEYS = new Set([
  "type",
  "version",
  "format",
  "indent",
  "direction",
  "children",
  "textFormat",
  "textStyle",
  "state",
]);

/**
 * Shared behaviour for every Eglador CMS block. Concrete per-type
 * classes are produced by {@link createCmsNodeClass} — each one carries
 * its own `getType()`, so a gallery serializes as
 * `{"type":"galeri","version":1,"format":"","id":"123"}`, matching how
 * the built-in image/video nodes serialize rather than collapsing every
 * CMS block into one generic node type.
 */
export class CmsBlockNode extends DecoratorBlockNode {
  __fields: CmsFieldValues;

  constructor(
    fields: CmsFieldValues = {},
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__fields = { ...fields };
  }

  /** The spec this node was generated from. Overridden by every class
   *  {@link createCmsNodeClass} produces — the base is never registered
   *  with an editor on its own. */
  getSpec(): CmsBlockSpec {
    throw new Error(
      "CmsBlockNode.getSpec() must be overridden — use createCmsNodeClass()",
    );
  }

  getFields(): CmsFieldValues {
    return this.getLatest().__fields;
  }

  setFields(fields: CmsFieldValues): this {
    const writable = this.getWritable();
    writable.__fields = { ...fields };
    return writable;
  }

  /** Field values are spread as top-level keys — the same flat shape
   *  `ImageNode` uses for `src` — with Lexical's own keys applied last
   *  so a stray field name can never clobber them. */
  exportJSON(): SerializedCmsBlockNode {
    const fields: Record<string, string> = {};
    for (const [name, value] of Object.entries(this.__fields)) {
      if (RESERVED_KEYS.has(name)) continue;
      fields[name] = value;
    }
    return { ...fields, ...super.exportJSON() };
  }

  /** Decorators render through React, so `$generateHtmlFromNodes` would
   *  otherwise emit the empty host `<div>`. Export the block as a
   *  data-attributed element instead, so HTML output stays lossless and
   *  machine-readable. */
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-cms-type", this.getSpec().type);
    for (const [name, value] of Object.entries(this.__fields)) {
      element.setAttribute(`data-${name.toLowerCase()}`, value);
    }
    return { element };
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): React.ReactElement {
    const embedBlockTheme =
      (config.theme as { embedBlock?: { base?: string; focus?: string } })
        .embedBlock ?? {};
    return (
      <BlockWithAlignableContents
        className={{
          base: embedBlockTheme.base ?? "",
          focus: embedBlockTheme.focus ?? "",
        }}
        format={this.__format}
        nodeKey={this.getKey()}
      >
        <CmsBlockHost
          spec={this.getSpec()}
          fields={this.__fields}
          nodeKey={this.getKey()}
        />
      </BlockWithAlignableContents>
    );
  }
}

/** Pull just the spec's declared fields out of a serialized payload,
 *  ignoring Lexical's own keys. */
function fieldsFromSerialized(
  spec: CmsBlockSpec,
  serialized: SerializedCmsBlockNode,
): CmsFieldValues {
  const fields: CmsFieldValues = {};
  for (const field of spec.fields) {
    const value = (serialized as Record<string, unknown>)[field.name];
    if (typeof value === "string") fields[field.name] = value;
    else if (typeof value === "number") fields[field.name] = String(value);
  }
  return fields;
}

/**
 * Shape of a generated CMS node class. Declared explicitly rather than
 * inferred: the inferred type of the anonymous class inside
 * {@link createCmsNodeClass} reaches into Lexical internals that aren't
 * exported, which `tsup`'s .d.ts build can't name.
 */
export type CmsNodeClass = Klass<CmsBlockNode>;

/**
 * Build a concrete Lexical node class for one CMS block spec.
 *
 * One class per type is what makes the JSON come out right: Lexical
 * keys its node registry by `getType()` and writes that same string
 * into `exportJSON()`, so the generated class must own the type — a
 * single shared class would serialize everything as one type.
 */
export function createCmsNodeClass(spec: CmsBlockSpec): CmsNodeClass {
  class GeneratedCmsNode extends CmsBlockNode {
    static getType(): string {
      return spec.type;
    }

    static clone(node: GeneratedCmsNode): GeneratedCmsNode {
      return new GeneratedCmsNode(node.__fields, node.__format, node.__key);
    }

    static importJSON(serialized: SerializedCmsBlockNode): GeneratedCmsNode {
      const node = new GeneratedCmsNode(
        fieldsFromSerialized(spec, serialized),
      );
      node.setFormat(serialized.format);
      return node;
    }

    getSpec(): CmsBlockSpec {
      return spec;
    }
  }

  return GeneratedCmsNode;
}

export function $isCmsBlockNode(
  node: LexicalNode | null | undefined,
): node is CmsBlockNode {
  return node instanceof CmsBlockNode;
}

interface CmsBlockHostProps {
  spec: CmsBlockSpec;
  fields: CmsFieldValues;
  nodeKey: NodeKey;
}

/** Bridges the presentational `CmsBlock` to the editor — `decorate()`
 *  can't use hooks itself, so the wiring lives in this component. */
function CmsBlockHost({ spec, fields, nodeKey }: CmsBlockHostProps) {
  const [editor] = useLexicalComposerContext();

  const handleSave = React.useCallback(
    (values: CmsFieldValues) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isCmsBlockNode(node)) node.setFields(values);
      });
    },
    [editor, nodeKey],
  );

  const handleRemove = React.useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isCmsBlockNode(node)) node.remove();
    });
  }, [editor, nodeKey]);

  return (
    <CmsBlock
      spec={spec}
      fields={fields}
      onSave={handleSave}
      onRemove={handleRemove}
    />
  );
}
