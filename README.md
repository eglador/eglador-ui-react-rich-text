<img src=".github/eglador-logo.svg" alt="eglador-ui-react-rich-text" width="200" />

# eglador-ui-react-rich-text

[![npm version](https://img.shields.io/npm/v/eglador-ui-react-rich-text?style=flat-square&color=blue)](https://www.npmjs.com/package/eglador-ui-react-rich-text)
[![npm downloads](https://img.shields.io/npm/dm/eglador-ui-react-rich-text?style=flat-square&color=green)](https://www.npmjs.com/package/eglador-ui-react-rich-text)
[![license](https://img.shields.io/npm/l/eglador-ui-react-rich-text?style=flat-square)](https://github.com/eglador/eglador-ui-react-rich-text/blob/main/LICENSE)
![lexical v0.44](https://img.shields.io/badge/lexical-v0.44-8B5CF6?style=flat-square)
![tailwind v4](https://img.shields.io/badge/tailwindcss-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![react >= 18](https://img.shields.io/badge/react-%3E%3D18-61DAFB?style=flat-square&logo=react&logoColor=white)
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

**Peer dependencies:** `react >= 18` · `react-dom >= 18` · `tailwindcss ^4`

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
| `RichTextToolbar` | Top formatting bar. Customize via `features`, `headingItems`, `insertItems`. |
| `RichTextContent` | Editable content area. Opt-ins: `draggable`, `floatingToolbar`. |
| `RichTextPageSize` | Bottom DevTools-style device toolbar (presets + custom px). |
| `RichTextDraggableBlock` | Drag handle plugin (auto-rendered when `draggable` is on). |
| `RichTextFloatingToolbar` | Selection-anchored mini formatting bar. |
| `RichTextLinkEditor` | Auto-opening link edit form when cursor enters a link. |
| `RichTextTableActions` | Cell-anchored chevron with insert/delete/merge/unmerge actions. |

### Hooks

| Export | Returns |
|---|---|
| `useRichTextEditor()` | `{ getJson, setJson, getHtml, setHtml, getMarkdown, setMarkdown, getText, clear, focus, editor }` |
| `usePageSize()` | `{ size, setSize }` — read/write the active page-size from the context |

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
| `editorRef` | `Ref<RichTextEditorApi>` | Imperative API ref |

### `RichTextToolbar` props

| Prop | Type | Description |
|---|---|---|
| `features` | `RichTextToolbarFeature[]` | Buttons to show. Default = all 20+ features |
| `headingItems` | `HeadingMenuItem[]` | Items inside the heading dropdown (default: paragraph + h1–h6) |
| `insertItems` | `InsertMenuItem[]` | Items inside the insert dropdown (default: HR + page break + table) |

### `RichTextContent` props

| Prop | Type | Description |
|---|---|---|
| `placeholder` | `ReactNode` | Empty-state placeholder (default `"Start writing..."`) |
| `minHeight` | `string` | Tailwind min-height class (default `"min-h-32"`) |
| `draggable` | `boolean` | Enable Notion-style drag handle + (+) insert menu |
| `floatingToolbar` | `boolean` | Enable selection-anchored mini formatting toolbar |

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

The `heading` and `insert` features render dropdowns; their inner items can be customized:

```ts
type HeadingMenuItem = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
type InsertMenuItem = "horizontalRule" | "pageBreak" | "table";
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

## Imperative API

```tsx
import { useRichTextEditor } from "eglador-ui-react-rich-text";

const editorRef = useRichTextEditor();

<RichTextEditor editorRef={editorRef}>
  <RichTextToolbar />
  <RichTextContent />
</RichTextEditor>

<button onClick={() => console.log(editorRef.current?.getHtml())}>Save</button>
<button onClick={() => editorRef.current?.clear()}>Clear</button>
<button onClick={() => editorRef.current?.focus()}>Focus</button>
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
