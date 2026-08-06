"use client";

import { $insertNodes, type Klass, type LexicalNode } from "lexical";
import type { BlockSpec } from "../blocks-registry";
import { CmsForm } from "./cms-form";
import { CMS_BLOCK_SCHEMA } from "./cms-schema";
import { CmsBlockNode, createCmsNodeClass } from "./cms-node-factory";
import type { CmsBlockSpec, CmsFieldValues } from "./cms-types";

interface CmsEntry {
  spec: CmsBlockSpec;
  NodeClass: ReturnType<typeof createCmsNodeClass>;
}

const CMS_ENTRIES: CmsEntry[] = CMS_BLOCK_SCHEMA.map((spec) => ({
  spec,
  NodeClass: createCmsNodeClass(spec),
}));

const NODE_CLASS_BY_TYPE = new Map(
  CMS_ENTRIES.map(({ spec, NodeClass }) => [spec.type, NodeClass]),
);

/** Every generated CMS node class — register these with the composer
 *  (already included in `defaultNodes`). */
export const cmsNodes: Klass<LexicalNode>[] = CMS_ENTRIES.map(
  (entry) => entry.NodeClass,
);

/**
 * Create a CMS block node by type. Returns `null` for an unknown type
 * rather than throwing, so callers importing external content can skip
 * unrecognized blocks.
 */
export function $createCmsNode(
  type: string,
  fields: CmsFieldValues = {},
): CmsBlockNode | null {
  const NodeClass = NODE_CLASS_BY_TYPE.get(type);
  return NodeClass ? new NodeClass(fields) : null;
}

/** Registry entries for the CMS blocks — merged into `defaultBlocks`,
 *  so they appear in the toolbar Insert menu and the slash menu. */
export const cmsBlocks: BlockSpec[] = CMS_ENTRIES.map(
  ({ spec, NodeClass }) => ({
    key: `cms-${spec.type}`,
    label: spec.title,
    description:
      spec.description ?? spec.fields.map((f) => f.label).join(" · "),
    icon: spec.icon,
    keywords: [spec.type, ...(spec.keywords ?? [])],
    category: "embed",
    surfaces: ["insert", "slash", "draggable"],
    renderForm: (editor, { onComplete, onCancel }) => (
      <CmsForm
        spec={spec}
        mode="insert"
        onSubmit={(values) => {
          editor.update(() => {
            $insertNodes([new NodeClass(values)]);
          });
          onComplete();
        }}
        onCancel={onCancel}
      />
    ),
  }),
);

export { CMS_BLOCK_SCHEMA } from "./cms-schema";
export {
  CmsBlockNode,
  createCmsNodeClass,
  $isCmsBlockNode,
} from "./cms-node-factory";
export type { SerializedCmsBlockNode } from "./cms-node-factory";
export { CmsForm, initialCmsValues } from "./cms-form";
export type { CmsFormProps } from "./cms-form";
export { CmsBlock } from "./cms-block";
export type { CmsBlockProps } from "./cms-block";
export { MediaThumb, parseIdList } from "./cms-previews";
export type {
  CmsBlockSpec,
  CmsFieldSpec,
  CmsFieldOption,
  CmsFieldInputType,
  CmsFieldValues,
} from "./cms-types";
