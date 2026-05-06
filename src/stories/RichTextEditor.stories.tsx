import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextPageSize,
  type RichTextValue,
} from "../components/rich-text";

const meta: Meta = {
  title: "Rich Text/Editor",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Lexical tabanlı zengin metin editörü. Compound API: `<RichTextEditor>` root, içine `<RichTextToolbar />` (opsiyonel) ve `<RichTextContent />`. Default plugin'ler: history, list, link, markdown shortcuts. Klavye kısayolları (Cmd+B, Cmd+I, Cmd+Z) ve markdown shortcut'ları (`**bold**`, `# heading`, `- list`) çalışır.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tam toolbar + içerik alanı. Toolbar default'ta tüm formatting feature'larıyla gelir.",
      },
      source: {
        code: `import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
} from "eglador-ui-react-rich-text";

export function MyEditor() {
  return (
    <RichTextEditor>
      <RichTextToolbar />
      <RichTextContent placeholder="Start writing..." />
    </RichTextEditor>
  );
}`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor>
        <RichTextToolbar />
        <RichTextContent placeholder="Start writing..." />
      </RichTextEditor>
    </div>
  ),
};

export const NoToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Toolbar olmadan — kullanıcı sadece klavye kısayollarıyla (Cmd+B, Cmd+I) ve markdown shortcut'larıyla (`**bold**`, `# heading`) formatlar.",
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor>
        <RichTextContent placeholder="Markdown shortcuts: **bold**, _italic_, # heading, - list, > quote" />
      </RichTextEditor>
    </div>
  ),
};

export const MinimalToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`features` array'i ile toolbar'da sadece istediğin butonlar.",
      },
      source: {
        code: `<RichTextEditor>
  <RichTextToolbar features={["bold", "italic", "underline", "separator", "link"]} />
  <RichTextContent />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor>
        <RichTextToolbar
          features={[
            "bold",
            "italic",
            "underline",
            "separator",
            "link",
          ]}
        />
        <RichTextContent placeholder="Minimal toolbar — only inline + link." />
      </RichTextEditor>
    </div>
  ),
};

export const AutoFocus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`autoFocus` prop'u ile editör mount olunca cursor otomatik olarak içeriğe düşer.",
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor autoFocus>
        <RichTextToolbar />
        <RichTextContent placeholder="Editor focused on mount..." />
      </RichTextEditor>
    </div>
  ),
};

export const Draggable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`<RichTextContent draggable />` ile Notion tarzı drag handle + insert menu aktifleşir. Block'a hover'la → solda **+** ve **grip** belirir. Grip'i tut ve sürükle ile sırala. **+**'a tıkla → yeni block tipi seç (paragraph, heading, list, quote, code).",
      },
      source: {
        code: `<RichTextEditor
  initialMarkdown={\`# Try the drag handle and + button

Hover over a block to see them.

- List item
- Another item

> Drag me to reorder.\`}
>
  <RichTextToolbar />
  <RichTextContent draggable />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor
        initialMarkdown={`# Try the drag handle and + button

Hover over a block to reveal the controls on the left.

## How it works

The grip icon lets you drag and reorder blocks. The + button opens a menu to insert a new block (heading, list, quote, code) below the current one.

- First list item
- Second list item
- Third list item

> Quotes can be dragged too.`}
      >
        <RichTextToolbar />
        <RichTextContent draggable />
      </RichTextEditor>
    </div>
  ),
};

export const FloatingToolbar: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`<RichTextContent floatingToolbar />` ile selection üzerinde float eden mini toolbar. Yazıyı seç → seçimin üstünde bold/italic/underline/strikethrough/code/link butonları belirir.",
      },
      source: {
        code: `<RichTextEditor>
  <RichTextContent floatingToolbar placeholder="Select text to see the floating toolbar..." />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor
        initialMarkdown={`# Select any text in this editor

Try selecting some words in this paragraph. A floating toolbar will appear above your selection with formatting options: **bold**, _italic_, underline, strikethrough, inline code, and link.

The floating toolbar is great for editors without a fixed top toolbar — Medium, Notion and similar apps use this pattern.`}
      >
        <RichTextContent
          floatingToolbar
          placeholder="Select text to see the floating toolbar..."
        />
      </RichTextEditor>
    </div>
  ),
};

export const FullFeatured: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tüm özellikler birlikte: top toolbar + page size + drag handle + insert menu + floating selection toolbar.",
      },
      source: {
        code: `<RichTextEditor>
  <RichTextToolbar />
  <RichTextContent draggable floatingToolbar />
  <RichTextPageSize />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div className="max-w-5xl">
      <RichTextEditor
        initialMarkdown={`# Full-featured editor

This editor has every feature enabled:

- Top toolbar with all formatting controls
- Drag handle on every block (hover to see)
- "+" button to insert new blocks
- Floating toolbar that appears when you select text
- Bottom device toolbar (Desktop / Tablet / Mobile)

Try selecting this sentence to see the floating toolbar.

> Every block can be reordered or have a new block inserted below it.`}
      >
        <RichTextToolbar />
        <RichTextContent draggable floatingToolbar />
        <RichTextPageSize />
      </RichTextEditor>
    </div>
  ),
};

export const PageSize: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`<RichTextPageSize />` editörün **alt kenarına** yerleşen DevTools-tarzı modern bar. Pill button grup ile **Full** / **Desktop** (1280) / **Tablet** (768) / **Mobile** (375), ortada canlı boyut göstergesi (`1280 × auto`), sağda **custom** px input. İçeriğe yerleşim için `<RichTextContent />`'ten sonra koy.",
      },
      source: {
        code: `<RichTextEditor>
  <RichTextToolbar />
  <RichTextContent draggable floatingToolbar />
  <RichTextPageSize />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div className="max-w-5xl">
      <RichTextEditor
        initialMarkdown={`# Responsive preview

Switch between **Desktop**, **Tablet**, and **Mobile** to see how your content looks at different widths.

The toolbar stays full-width — only the editing area is constrained.

## Try it out

- Click **Tablet** at the bottom and watch the content reflow to 768px.
- Click **Mobile** for a 375px-wide preview.
- Use the **custom** input for arbitrary widths (e.g. 1024 for laptop).`}
      >
        <RichTextToolbar />
        <RichTextContent draggable floatingToolbar />
        <RichTextPageSize />
      </RichTextEditor>
    </div>
  ),
};

export const InitialMarkdown: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`initialMarkdown` prop'u ile editor markdown string'inden başlar. `@lexical/markdown` TRANSFORMERS ile parse edilir.",
      },
      source: {
        code: `<RichTextEditor
  initialMarkdown={\`# Welcome

This editor was loaded from **markdown**.

- First item
- Second item
- Third item

> Block quotes work too.\`}
>
  <RichTextToolbar />
  <RichTextContent />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor
        initialMarkdown={`# Welcome

This editor was loaded from **markdown**.

- First item
- Second item
- Third item

> Block quotes work too.`}
      >
        <RichTextToolbar />
        <RichTextContent />
      </RichTextEditor>
    </div>
  ),
};

export const InitialHtml: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`initialHtml` prop'u ile editor HTML string'inden başlar. `@lexical/html` ile DOM parse edilip Lexical node'larına dönüştürülür.",
      },
      source: {
        code: `<RichTextEditor
  initialHtml="<h2>Hello HTML</h2><p>Loaded from <strong>HTML</strong> string.</p>"
>
  <RichTextToolbar />
  <RichTextContent />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div>
      <RichTextEditor
        initialHtml='<h2>Hello HTML</h2><p>This editor was loaded from <strong>HTML</strong> string. You can also have <em>italic</em>, <u>underline</u>, and <a href="https://example.com">links</a>.</p><ul><li>Bullet one</li><li>Bullet two</li></ul>'
      >
        <RichTextToolbar />
        <RichTextContent />
      </RichTextEditor>
    </div>
  ),
};

export const ReadOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`editable={false}` ile içerik salt-okunur. Toolbar bu modda da render olur ama dispatch etse bile değişiklik olmaz.",
      },
    },
  },
  render: () => {
    const initialJson = JSON.stringify({
      root: {
        type: "root",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        children: [
          {
            type: "heading",
            tag: "h2",
            version: 1,
            format: "",
            indent: 0,
            direction: "ltr",
            children: [
              {
                type: "text",
                text: "Read-only example",
                version: 1,
                format: 0,
                style: "",
                mode: "normal",
                detail: 0,
              },
            ],
          },
          {
            type: "paragraph",
            version: 1,
            format: "",
            indent: 0,
            direction: "ltr",
            textFormat: 0,
            textStyle: "",
            children: [
              {
                type: "text",
                text: "This editor is rendered in ",
                version: 1,
                format: 0,
                style: "",
                mode: "normal",
                detail: 0,
              },
              {
                type: "text",
                text: "read-only",
                version: 1,
                format: 1,
                style: "",
                mode: "normal",
                detail: 0,
              },
              {
                type: "text",
                text: " mode.",
                version: 1,
                format: 0,
                style: "",
                mode: "normal",
                detail: 0,
              },
            ],
          },
        ],
      },
    });

    return (
      <div>
        <RichTextEditor editable={false} initialJson={initialJson}>
          <RichTextContent />
        </RichTextEditor>
      </div>
    );
  },
};

export const WithOutput: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "`onChange` callback'i her güncellemede `{ json, html, text }` üçlüsünü verir.",
      },
      source: {
        code: `import { useState } from "react";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  type RichTextValue,
} from "eglador-ui-react-rich-text";

export function MyEditor() {
  const [value, setValue] = useState<RichTextValue>();

  return (
    <>
      <RichTextEditor onChange={setValue}>
        <RichTextToolbar />
        <RichTextContent placeholder="Type to see live output..." />
      </RichTextEditor>

      <pre>{value?.html}</pre>
    </>
  );
}`,
      },
    },
  },
  render: () => {
    const [value, setValue] = React.useState<RichTextValue>();
    const [tab, setTab] = React.useState<
      "html" | "markdown" | "json" | "text"
    >("html");

    const content =
      !value || value[tab] === undefined
        ? "—"
        : tab === "json"
          ? JSON.stringify(JSON.parse(value.json), null, 2)
          : value[tab];

    const tabs: Array<{
      key: "html" | "markdown" | "json" | "text";
      label: string;
    }> = [
      { key: "html", label: "HTML" },
      { key: "markdown", label: "Markdown" },
      { key: "json", label: "JSON" },
      { key: "text", label: "Text" },
    ];

    return (
      <div className="max-w-3xl space-y-4">
        <RichTextEditor onChange={setValue}>
          <RichTextToolbar />
          <RichTextContent placeholder="Type to see live output below..." />
        </RichTextEditor>

        <div className="rounded-lg border border-zinc-200 overflow-hidden">
          <div className="flex border-b border-zinc-200 bg-zinc-50">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  tab === t.key
                    ? "px-4 py-2 text-xs font-medium bg-white text-zinc-900 border-b-2 border-blue-500 -mb-px cursor-pointer"
                    : "px-4 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <pre className="p-4 text-xs font-mono text-zinc-700 max-h-72 overflow-auto whitespace-pre-wrap break-all">
            {content}
          </pre>
        </div>
      </div>
    );
  },
};
