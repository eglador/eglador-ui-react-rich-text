<img src=".github/eglador-logo.svg" alt="eglador-ui-react-rich-text" width="200" />

# eglador-ui-react-rich-text

[![npm version](https://img.shields.io/npm/v/eglador-ui-react-rich-text?style=flat-square&color=blue)](https://www.npmjs.com/package/eglador-ui-react-rich-text)
[![npm downloads](https://img.shields.io/npm/dm/eglador-ui-react-rich-text?style=flat-square&color=green)](https://www.npmjs.com/package/eglador-ui-react-rich-text)
[![license](https://img.shields.io/npm/l/eglador-ui-react-rich-text?style=flat-square)](https://github.com/eglador/eglador-ui-react-rich-text/blob/main/LICENSE)
![lexical v0.46](https://img.shields.io/badge/lexical-v0.46-8B5CF6?style=flat-square)
![tailwind v4](https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![react 19](https://img.shields.io/badge/react-19-61DAFB?style=flat-square&logo=react&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-ready-3178C6?style=flat-square&logo=typescript&logoColor=white)

A modern, compound-component rich text editor for React — built on top of [Lexical](https://lexical.dev) and styled with **Tailwind CSS v4**.

## Features

- **Compound API** — `RichTextEditor`, `RichTextToolbar`, `RichTextContent`, `RichTextPageSize` (composition over configuration, shadcn/ui style)
- **20+ toolbar features** — undo/redo, headings (h1–h6), bold/italic/underline/strikethrough/code, text transform (case + sub/super/highlight), text & background color, lists, alignment (LTR/RTL + indent/outdent), quote, link, insert (HR/page break/table)
- **Notion-style drag handle** — block reorder + (+) insert menu (`<RichTextContent draggable />`)
- **Floating selection toolbar** — Medium/Notion pattern (`<RichTextContent floatingToolbar />`)
- **Auto-opening link editor** — cursor enters link → form appears anchored to the link with `url` / `target` / `rel`
- **Table support** — grid picker insert + cell-anchored action menu (insert/delete row/col, merge, unmerge, delete table)
- **Page size simulator** — DevTools-style bottom bar (Full / Desktop 1280 / Tablet 768 / Mobile 375 + custom)
- **Custom nodes** — official `HorizontalRuleNode` + custom `PageBreakNode` decorator (`break-after: page` for print/PDF)
- **HTML / JSON / Markdown** — round-trip serialization on `onChange` and via `initial*` props
- **Imperative API** — `useRichTextEditor()` hook + `editorRef` prop
- **TypeScript-first** — full type safety, exported feature unions
- **Viewport-aware popovers** — auto-flip / auto-shift, never clipped by ancestor `overflow: hidden`

## Installation

```bash
npm install eglador-ui-react-rich-text
```

**Peer dependencies:** `react ^19` · `react-dom ^19` · `tailwindcss ^4`

All Lexical packages ship as direct dependencies — no separate install needed.

## Setup

Add the following to your global stylesheet so Tailwind picks up the component classes:

```css
@import "tailwindcss";
@source "../node_modules/eglador-ui-react-rich-text";
```

The `@source` path is relative to the CSS file location:

| Framework | CSS file location | Path |
|---|---|---|
| Next.js (App Router) | `app/globals.css` | `../node_modules/eglador-ui-react-rich-text` |
| Next.js (`src/`) | `src/app/globals.css` | `../../node_modules/eglador-ui-react-rich-text` |
| Vite | `src/index.css` | `../node_modules/eglador-ui-react-rich-text` |

## Quick Start

```tsx
"use client";

import {
  RichTextEditor,
  RichTextToolbar,
  RichTextContent,
  RichTextPageSize,
} from "eglador-ui-react-rich-text";

export function MyEditor() {
  return (
    <RichTextEditor
      initialMarkdown="# Hello\n\nStart **typing**..."
      onChange={(value) => console.log(value.html)}
    >
      <RichTextToolbar />
      <RichTextContent draggable floatingToolbar />
      <RichTextPageSize />
    </RichTextEditor>
  );
}
```

## API

### Components

| Component | Purpose |
|---|---|
| `RichTextEditor` | Root provider. Lexical composer + theme + nodes + plugins. |
| `RichTextToolbar` | Top formatting bar. Customize via `features`, `headingItems`, `insertBlocks`. |
| `RichTextContent` | Editable content area. Opt-ins: `draggable`, `floatingToolbar`. |
| `RichTextPageSize` | Bottom DevTools-style device toolbar (presets + custom px). |
| `RichTextDraggableBlock` | Drag handle plugin (auto-rendered when `draggable` is on). |
| `RichTextFloatingToolbar` | Selection-anchored mini formatting bar. |
| `RichTextLinkEditor` | Auto-opening link edit form when cursor enters a link. |
| `RichTextTableActions` | Cell-anchored chevron with insert/delete/merge/unmerge actions. |

### Hooks

| Export | Returns |
|---|---|
| `useRichTextEditor()` | `{ editor, getJson, setJson, getHtml, setHtml, getMarkdown, setMarkdown, getText, getCursorOffset, setCursorOffset, getLegacyShortcodes, importLegacyComponents, insertAllComponents, clear, focus }` — **must be called inside `<RichTextEditor>`** |
| `usePageSize()` | `{ size, setSize }` — read/write the active page-size from the context |
| `useResolvedSrc(id)` | `{ src, status }` — turn a media ID into a URL via `resolveImageSrc` (`status`: `idle` \| `loading` \| `resolved` \| `missing`) |

### `RichTextEditor` props

| Prop | Type | Description |
|---|---|---|
| `initialJson` | `string` | Initial state from a JSON-serialized Lexical editor state |
| `initialHtml` | `string` | Initial state from HTML (parsed via `$generateNodesFromDOM`) |
| `initialMarkdown` | `string` | Initial state from Markdown (via `TRANSFORMERS`). Priority: markdown > html > json |
| `onChange` | `(value: RichTextValue) => void` | Fires on every editor update with `{ json, html, text, markdown }` |
| `editable` | `boolean` | Default `true`. Reactive — toggles read-only mode imperatively |
| `autoFocus` | `boolean` | Focus on mount |
| `namespace` | `string` | Lexical namespace (default `"eglador-rich-text"`) |
| `maxLength` | `number` | Character limit. Overflow is wrapped in an `OverflowNode` and a counter is shown |
| `charset` | `"UTF-8" \| "UTF-16"` | Counting mode for `maxLength` (default `"UTF-16"` = `String.length`) |
| `resolveImageSrc` | `(id: string) => string \| null \| Promise<string \| null>` | Resolves CMS media IDs to URLs — see [Media by ID](#media-by-id-resolveimagesrc) |
| `editorRef` | `Ref<LexicalEditor>` | Raw Lexical instance (**not** the `useRichTextEditor()` API object) |

### `RichTextToolbar` props

| Prop | Type | Description |
|---|---|---|
| `features` | `RichTextToolbarFeature[]` | Buttons to show. Default = all 20+ features |
| `headingItems` | `HeadingMenuItem[]` | Items inside the heading dropdown (default: paragraph + h1–h6) |
| `insertBlocks` | `BlockSpec[]` | Blocks in the Insert dropdown. Defaults to `defaultBlocks` filtered to the `insert` surface |

### `RichTextContent` props

| Prop | Type | Description |
|---|---|---|
| `placeholder` | `ReactNode` | Empty-state placeholder (default `"Start writing..."`) |
| `minHeight` | `string` | Tailwind min-height class (default `"min-h-32"`) |
| `draggable` | `boolean` | Enable Notion-style drag handle + (+) insert menu |
| `draggableBlocks` | `BlockSpec[]` | Blocks in the drag-handle (+) menu |
| `floatingToolbar` | `boolean` | Enable selection-anchored mini formatting toolbar |
| `mode` | `"rich" \| "plain"` | `"plain"` swaps in `PlainTextPlugin` — text only, no formatting commands |

### Optional slots

Drop any of these inside `<RichTextEditor>`; each subscribes on its own.

| Component | Purpose |
|---|---|
| `RichTextSlashCommands` | `/` typeahead block menu. Takes the same `blocks` array as the toolbar |
| `RichTextAutoEmbed` | Offers to embed a recognized pasted URL (YouTube, .mp3, .mp4, images) |
| `RichTextStats` | Live word / character count, optional reading time |
| `RichTextFindReplace` | Find & replace panel (Cmd/Ctrl+F) |
| `RichTextOutput` | Tabbed HTML / Markdown / JSON / Text panel with copy + download |
| `RichTextDevGlobals` | Registers the `lexicalComponentAllSet()` console helper |

## Toolbar Features

```ts
type RichTextToolbarFeature =
  | "undo" | "redo"
  | "heading" | "paragraph"
  | "heading1" | "heading2" | "heading3"
  | "heading4" | "heading5" | "heading6"
  | "bold" | "italic" | "underline" | "strikethrough" | "code"
  | "textTransform"
  | "textColor" | "backgroundColor"
  | "bulletList" | "orderedList"
  | "alignment"
  | "quote" | "link"
  | "insert"
  | "separator";
```

The `heading` and `insert` features render dropdowns. The heading dropdown takes a list of block types; the insert dropdown takes `BlockSpec[]` from the shared registry:

```ts
type HeadingMenuItem = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

// Insert dropdown — filter/extend the registry, don't pass string keys
import { defaultBlocks } from "eglador-ui-react-rich-text";
<RichTextToolbar insertBlocks={defaultBlocks.filter((b) => b.key !== "table")} />
```

## Custom Nodes

For custom Lexical configurations, the package exports node + plugin primitives:

```tsx
import {
  PageBreakNode,
  PageBreakPlugin,
  INSERT_PAGE_BREAK_COMMAND,
  $createPageBreakNode,
  $isPageBreakNode,
} from "eglador-ui-react-rich-text";
```

## Eglador CMS Blocks

The package ships one **real Lexical node per CMS component type**. They preview live in the editor (hover → gear to edit, drag handle to reorder) and serialize to ordinary Lexical JSON under their own `type` — *not* to a `#type#field#value#` text run:

```json
{ "type": "galeri", "version": 1, "format": "", "id": "345456" }
```

They are already in `defaultNodes` and `defaultBlocks`, so a plain `<RichTextEditor>` has them. Nothing to register.

### Types

`360resim` · `baslik` · `canliyayin` · `countdown` · `depomkacadolar` · `depremler` · `dikeyciftli` · `dikeylink` · `flourish` · `galeri` · `habericionecikanlar` · `habericireklam` · `havadurumu` · `kredihesaplama` · `kurcevirici` · `linkEmbed` · `mansethaberresim` · `newsMoment` · `ozelharf` · `piyasa` · `quato1` · `resimliquato` · `sabitlink` · `videooynat` · `yatayciftli` · `yataytekli`

Read the authoritative field list at runtime instead of hardcoding it:

```ts
import { CMS_BLOCK_SCHEMA } from "eglador-ui-react-rich-text";

CMS_BLOCK_SCHEMA.map((s) => ({ type: s.type, fields: s.fields.map((f) => f.name) }));
```

**Two naming caveats when mapping back to legacy shortcodes:**

| Legacy | In this package | Why |
|---|---|---|
| `#link#...#` | type `linkEmbed` | `@lexical/link`'s `LinkNode` already owns the `link` node type; a second one would silently replace it and break every hyperlink |
| `type1` / `id1` / `type2` / `id2` | `firstContentType` / `firstContentId` / `secondContentType` / `secondContentId` | the originals don't say *what* type or *what* id |

Three legacy types map onto built-in blocks rather than getting their own: `resim` → the `image` block (ID mode), `video` → the `video` block (ID mode), `imagecompare` → the `image-comparison` block.

### Media by ID (`resolveImageSrc`)

Blocks that address media by ID never store the URL — the document holds the ID, and the page resolves it for preview. Wire the callback once on the root:

```tsx
<RichTextEditor
  resolveImageSrc={async (id) => {
    const res = await fetch(`/api/media/${id}`);
    return res.ok ? (await res.json()).url : null; // null → "not found" placeholder
  }}
>
```

Sync resolvers (an in-memory map) work too. This callback drives the `image` / `video` blocks in ID mode **and** every `image-ids` field (e.g. `newsMoment.images`, previewed as thumbnails).

With `options.imageId` set, `exportJSON()` omits `src` entirely:

```json
{ "type": "image", "version": 1, "format": "",
  "options": { "alt": "", "caption": "", "maxWidth": 0, "imageId": "345456" } }
```

Leave the ID blank and paste a URL to get the original URL behaviour back (`src` is serialized as before).

### Creating blocks programmatically

```tsx
import { $createCmsNode } from "eglador-ui-react-rich-text";
import { $getRoot } from "lexical";

editor.update(() => {
  const node = $createCmsNode("galeri", { id: "345456" }); // null for unknown types
  if (node) $getRoot().append(node);
});
```

### Matching the Insert and slash menus

Both surfaces read the same registry, so pass one array to all of them and they cannot drift apart:

```tsx
const HIDDEN = ["check-list", "horizontal-rule", "page-break", "date-time", "code-block"];
const blocks = defaultBlocks.filter((b) => !HIDDEN.includes(b.key));

<RichTextEditor resolveImageSrc={resolveImageSrc}>
  <RichTextToolbar insertBlocks={blocks} />
  <RichTextContent draggable floatingToolbar draggableBlocks={blocks} />
  <RichTextSlashCommands blocks={blocks} />
</RichTextEditor>
```

`getBlocksForSurface("insert", blocks)` and `getBlocksForSurface("slash", blocks)` return identical lists in identical order, and a block with a `renderForm` opens that form on either surface.

### Adding a new CMS type

One entry in [`src/components/rich-text/cms/cms-schema.tsx`](src/components/rich-text/cms/cms-schema.tsx) — the node class, the Insert/slash menu entries and the form are all generated from it:

```ts
{
  type: "myblock",            // must be unique across ALL Lexical node types
  title: "Benim Bloğum",
  icon: <FrameIcon className="size-4" />,
  fields: [
    { name: "id", label: "ID", inputType: "text" },
    { name: "position", label: "Hizalama", inputType: "select", options: POSITION_LEFT_RIGHT },
  ],
  renderPreview: (fields) => <div>…</div>,  // optional; omit for the generic card
}
```

`inputType`: `text` · `url` · `number` · `select` · `textarea` · `date` · `time` · `image-ids`.

A duplicate `type` throws at import time (guard in [`nodes.ts`](src/components/rich-text/nodes.ts)) rather than silently shadowing another node.

### Inserting every component at once

For eyeballing an integration — no UI required.

```tsx
import { useRichTextEditor, RichTextDevGlobals } from "eglador-ui-react-rich-text";

function FillButton() {
  const { insertAllComponents } = useRichTextEditor(); // call inside <RichTextEditor>
  return (
    <>
      <button onClick={() => insertAllComponents()}>Clear + insert all</button>
      <button onClick={() => insertAllComponents({ mode: "append" })}>Append at end</button>
    </>
  );
}
```

Or from outside the tree: `insertAllComponents(editor, options)` — returns the number of blocks inserted.

Drop `<RichTextDevGlobals />` inside `<RichTextEditor>` to get a console escape hatch:

```js
lexicalComponentAllSet()                                   // clear, then insert all
lexicalComponentAllSet("append")                           // keep content, add at end
lexicalComponentAllSet({ mode: "append", cmsTypes: ["galeri", "newsMoment"] })
```

| Option | Default | Meaning |
|---|---|---|
| `mode` | `"replace"` | `"replace"` clears the document first; `"append"` adds at the end |
| `includeHeadings` | `true` | section headings + explanatory paragraphs |
| `includeBuiltIns` | `true` | text blocks, table, columns, media embeds |
| `cmsTypes` | all | restrict the CMS section; `[]` skips it |
| `sample` | public samples | placeholder media — see `ALL_COMPONENTS_DEFAULT_SAMPLE` |

Point it at your own media so previews actually resolve:

```tsx
insertAllComponents({ sample: { imageId: "345456", videoId: "913597", mediaIds: ["1", "2"] } });
```

The global is registered on mount and removed on unmount; pass `name` if several editors share a page. Gate it in production if you'd rather not ship it: `{process.env.NODE_ENV !== "production" && <RichTextDevGlobals />}`.

## Legacy Components

Embeds a legacy CMS shortcode — a generic `#type#field#value#field#value#` block — without the library having any built-in notion of what a "video" or "image" component is. The available types and their form fields are entirely defined by your own `LegacyComponentSpec[]` schema, passed at the call site.

```tsx
import {
  RichTextEditor,
  RichTextToolbar,
  RichTextContent,
  RichTextSlashCommands,
  defaultBlocks,
  createLegacyComponentBlocks,
  type LegacyComponentSpec,
} from "eglador-ui-react-rich-text";

const legacySchema: LegacyComponentSpec[] = [
  {
    type: "resim",
    title: "Image (legacy)",
    fields: [
      { name: "src", label: "URL", inputType: "url" },
      { name: "alt", label: "Alt text", inputType: "text", optional: true },
    ],
  },
];

const blocks = [...defaultBlocks, ...createLegacyComponentBlocks(legacySchema)];

export function MyEditor() {
  return (
    <RichTextEditor>
      <RichTextToolbar insertBlocks={blocks} />
      <RichTextContent draggable />
      <RichTextSlashCommands blocks={blocks} />
    </RichTextEditor>
  );
}
```

- `createLegacyComponentBlocks(schema)` turns each `LegacyComponentSpec` into a `BlockSpec` that opens a form (built from `spec.fields`) on the `"insert"` / `"slash"` surfaces — merge the result into `defaultBlocks` and pass it to `RichTextToolbar`, `RichTextSlashCommands`, and `RichTextDraggableBlock` via the `blocks` prop.
- Submitting the form inserts the shortcode string as plain, ordinary editable text — not a locked decorator — so the user can revise it by hand afterwards (fix a typo, tweak a value) like any other text in the document.
- By default a type renders as `#type#field#value#field#value#...#` (e.g. `#resim#src#https://...#alt#Cover#`). Give a `LegacyComponentSpec` its own `template` to control the exact output instead — `{type}` and `{fieldName}` placeholders are substituted with the submitted values, and any field not referenced is simply omitted:
  ```ts
  {
    type: "resim",
    title: "Image (legacy)",
    template: "#{type}#{src}#", // → "#resim#https://...#" (alt text dropped)
    fields: [
      { name: "src", label: "URL", inputType: "url" },
      { name: "alt", label: "Alt text", inputType: "text", optional: true },
    ],
  }
  ```
- `getHtml()` / `getMarkdown()` / `getText()` (from `useRichTextEditor()`) all preserve the shortcode string exactly as inserted, template or not.
- `editorRef.current?.getLegacyShortcodes()` returns every legacy shortcode line currently in the document as an array of strings, in document order — works regardless of which types use a custom `template`.
- `editorRef.current?.importLegacyComponents(items, schema)` appends typed `LegacyComponentInput` objects (`{ type, fields }`) programmatically — pass the same `schema` you gave `createLegacyComponentBlocks()` so each item's `template` (if any) is honored; omit it to always use the default layout.

## Imperative API

There are two ways in, and they are not interchangeable.

**`useRichTextEditor()` — from inside the tree.** It is a hook: it reads the Lexical composer context, so it only works in a component rendered *within* `<RichTextEditor>`. It returns the full `RichTextEditorApi` object.

```tsx
import { RichTextEditor, RichTextContent, RichTextToolbar, useRichTextEditor }
  from "eglador-ui-react-rich-text";

function SaveBar() {
  const { getHtml, clear, focus } = useRichTextEditor();
  return (
    <div>
      <button onClick={() => console.log(getHtml())}>Save</button>
      <button onClick={clear}>Clear</button>
      <button onClick={focus}>Focus</button>
    </div>
  );
}

<RichTextEditor>
  <RichTextToolbar />
  <SaveBar />          {/* must be a child */}
  <RichTextContent />
</RichTextEditor>
```

**`editorRef` prop — from outside.** This takes a `Ref<LexicalEditor>` (the raw Lexical instance), *not* the API object above. Use it when the caller lives outside the editor, e.g. a form submit handler.

```tsx
import { useRef } from "react";
import type { LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";

const editorRef = useRef<LexicalEditor | null>(null);

<RichTextEditor editorRef={editorRef}>
  <RichTextToolbar />
  <RichTextContent />
</RichTextEditor>

<button
  onClick={() =>
    editorRef.current?.read(() => console.log($generateHtmlFromNodes(editorRef.current!)))
  }
>
  Save
</button>
```

## Read-Only Mode

```tsx
<RichTextEditor editable={false} initialJson={savedState}>
  <RichTextContent />
</RichTextEditor>
```

`editable` is fully reactive — toggling it after mount switches between editable and read-only via Lexical's `setEditable()` API.

## Compatibility

Works with any React-based framework: **Next.js**, **Remix**, **Vite + React**, **Gatsby**, etc.

All editor components are marked `"use client"` (Lexical requires the DOM).

## Development

```bash
npm install
npm run dev               # tsup watch mode
npm run build             # production build to dist/
npm run typecheck         # tsc --noEmit
npm run storybook         # Storybook dev (http://localhost:6006)
npm run build-storybook   # static Storybook export
```

## Publishing

Publishing is automated via GitHub Actions. When a GitHub Release is created, the package is published to npm.

1. Update `version` in `package.json`
2. Commit and push
3. Create a GitHub Release with a matching tag (e.g. `v1.0.0`)

## Author

Kenan Gündoğan — [https://github.com/kenangundogan](https://github.com/kenangundogan)

Maintained under [Eglador](https://github.com/eglador)

## License

MIT
