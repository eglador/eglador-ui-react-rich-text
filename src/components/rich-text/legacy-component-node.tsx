"use client";

import * as React from "react";
import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import {
  legacyComponentToShortcode,
  type LegacyComponentInput,
} from "./legacy-shortcode";

export type SerializedLegacyComponentNode = Spread<
  { componentType: string; fields: Record<string, string> },
  SerializedLexicalNode
>;

/**
 * One block of a fully generic `#type#field#value#field#value#` legacy
 * CMS shortcode. Storage is `componentType` + a field/value map — there
 * is no built-in notion of "video" or "image"; the available types and
 * their fields are entirely defined by the consumer's own
 * `LegacyComponentSpec[]` (legacy-schema.ts) at the call site.
 *
 * Renders as the literal shortcode string — this is CMS-internal markup,
 * not a previewable embed, so the editor shows it as plain text rather
 * than a styled card.
 */
export class LegacyComponentNode extends DecoratorNode<React.ReactElement> {
  __componentType: string;
  __fields: Record<string, string>;

  static getType(): string {
    return "legacy-component";
  }

  static clone(node: LegacyComponentNode): LegacyComponentNode {
    return new LegacyComponentNode(
      node.__componentType,
      node.__fields,
      node.__key,
    );
  }

  static importJSON(
    serialized: SerializedLegacyComponentNode,
  ): LegacyComponentNode {
    return $createLegacyComponentNode(
      serialized.componentType,
      serialized.fields,
    );
  }

  exportJSON(): SerializedLegacyComponentNode {
    return {
      type: "legacy-component",
      version: 1,
      componentType: this.__componentType,
      fields: this.__fields,
    };
  }

  constructor(
    componentType: string,
    fields: Record<string, string>,
    key?: NodeKey,
  ) {
    super(key);
    this.__componentType = componentType;
    this.__fields = fields;
  }

  getComponentType(): string {
    return this.__componentType;
  }

  getFields(): Record<string, string> {
    return this.__fields;
  }

  /** The literal `#type#field#value#field#value#` string this node represents. */
  getShortcode(): string {
    return legacyComponentToShortcode({
      type: this.__componentType,
      fields: this.__fields,
    });
  }

  createDOM(): HTMLElement {
    const div = document.createElement("div");
    div.className = "my-1";
    return div;
  }

  updateDOM(): boolean {
    return false;
  }

  /** `createDOM()`'s element is the editor-only decorator host — React
   *  fills it via `decorate()`, which `$generateHtmlFromNodes` never
   *  calls. Export the shortcode text directly so HTML output matches
   *  what the editor shows. Exported as a plain `<p>` (not the `<div>`
   *  used by `createDOM()`) so re-importing the HTML lands on an
   *  ordinary editable paragraph the user can revise, instead of being
   *  re-parsed back into a non-editable decorator node. */
  exportDOM(_editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement("p");
    element.textContent = this.getShortcode();
    return { element };
  }

  isInline(): false {
    return false;
  }

  getTextContent(): string {
    return this.getShortcode();
  }

  decorate(): React.ReactElement {
    return (
      <span
        contentEditable={false}
        className="font-mono text-sm text-zinc-700 bg-zinc-100 rounded px-1.5 py-0.5 select-all"
      >
        {this.getShortcode()}
      </span>
    );
  }
}

export function $createLegacyComponentNode(
  componentType: string,
  fields: Record<string, string>,
): LegacyComponentNode {
  return new LegacyComponentNode(componentType, fields);
}

/** Convenience constructor from a {@link LegacyComponentInput}. Coerces
 *  every field value to a string (storage is always string-keyed). */
export function $createLegacyComponentNodeFromInput(
  input: LegacyComponentInput,
): LegacyComponentNode {
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(input.fields)) {
    fields[name] = String(value);
  }
  return new LegacyComponentNode(input.type, fields);
}

export function $isLegacyComponentNode(
  node: LexicalNode | null | undefined,
): node is LegacyComponentNode {
  return node instanceof LegacyComponentNode;
}
