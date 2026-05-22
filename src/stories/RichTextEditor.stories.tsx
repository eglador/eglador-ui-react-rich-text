import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextPageSize,
  RichTextOutput,
} from "../components/rich-text";

const meta: Meta = {
  title: "Rich Text/Editor",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Lexical-based rich text editor. Compound API: `<RichTextEditor>` root containing `<RichTextToolbar />` (optional) and `<RichTextContent />`. Default plugins: history, list, link, markdown shortcuts. Keyboard shortcuts (Cmd+B, Cmd+I, Cmd+Z) and markdown shortcuts (`**bold**`, `# heading`, `- list`) all work.",
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
          "Full toolbar + content area. The toolbar ships with every formatting feature enabled by default.",
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
          "Without a toolbar — the user only formats via keyboard shortcuts (Cmd+B, Cmd+I) and markdown shortcuts (`**bold**`, `# heading`).",
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
          "Use the `features` array to show only the toolbar buttons you want.",
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
          "With the `autoFocus` prop, the cursor is placed in the content automatically on mount.",
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
          "`<RichTextContent draggable />` enables a Notion-style drag handle + insert menu. Hover a block → a **+** and **grip** icon appear on the left. Hold the grip and drag to reorder. Click **+** → pick a new block type (paragraph, heading, list, quote, code).",
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
          "`<RichTextContent floatingToolbar />` shows a mini toolbar floating above the current selection. Select some text → bold/italic/underline/strikethrough/code/link buttons appear above the selection.",
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
          "All features combined: top toolbar + page size + drag handle + insert menu + floating selection toolbar.",
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
          "`<RichTextPageSize />` is a modern DevTools-style bar that sits at the **bottom edge** of the editor. A pill button group with **Full** / **Desktop** (1280) / **Tablet** (768) / **Mobile** (375), a live size indicator in the middle (`1280 × auto`), and a **custom** px input on the right. Place it after `<RichTextContent />` to anchor it to the content.",
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
          "The `initialMarkdown` prop starts the editor from a markdown string. Parsed via `@lexical/markdown` TRANSFORMERS.",
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
          "The `initialHtml` prop starts the editor from an HTML string. Parsed via `@lexical/html` and converted into Lexical nodes.",
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
          "`editable={false}` makes the content read-only. The toolbar still renders, but its dispatches have no effect.",
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
          "`<RichTextOutput />` is a DevTools-style tab panel that sits below the editor. It shows HTML / Markdown / JSON / Text serializations live and copies to the clipboard via a Copy button. Customizable via `tabs`, `defaultTab`, `showCopy`, and `maxHeight`. Like PageSize, drop it once inside `<RichTextEditor>` — it subscribes on its own (no `onChange` needed).",
      },
      source: {
        code: `import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextOutput,
} from "eglador-ui-react-rich-text";

export function MyEditor() {
  return (
    <RichTextEditor>
      <RichTextToolbar />
      <RichTextContent placeholder="Type to see live output..." />
      <RichTextOutput />
    </RichTextEditor>
  );
}`,
      },
    },
  },
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor>
        <RichTextToolbar />
        <RichTextContent placeholder="Type to see live output below..." />
        <RichTextOutput />
      </RichTextEditor>
    </div>
  ),
};
