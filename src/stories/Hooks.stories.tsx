import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { LexicalEditor } from "lexical";
import {
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextSlashCommands,
  useRichTextEditor,
  defaultBlocks,
  RichTextOutput,
  createLegacyComponentBlocks,
  type LegacyComponentInput,
  type LegacyComponentSpec,
} from "../components/rich-text";

const meta: Meta = {
  title: "Rich Text/Hooks",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Two ways to control the editor programmatically: the `useRichTextEditor()` hook (from inside the editor's children) or the `editorRef` prop (from outside).",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── useRichTextEditor — in-tree control ─────

function TemplateButtons() {
  const { setMarkdown, setHtml, clear } = useRichTextEditor();
  return (
    <div className="flex flex-wrap gap-2 px-2 py-1.5 border-b border-zinc-200 bg-zinc-50">
      <button
        type="button"
        onClick={() =>
          setMarkdown(
            "# Markdown Template\n\n" +
              "This was loaded **programmatically** via `setMarkdown`.\n\n" +
              "- Item one\n- Item two\n- Item three\n\n" +
              "> Pretty cool, right?",
          )
        }
        className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
      >
        Load Markdown
      </button>
      <button
        type="button"
        onClick={() =>
          setHtml(
            "<h2>HTML Template</h2><p>Loaded with <strong>setHtml</strong>.</p><ul><li>One</li><li>Two</li></ul>",
          )
        }
        className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
      >
        Load HTML
      </button>
      <button
        type="button"
        onClick={clear}
        className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
      >
        Clear
      </button>
    </div>
  );
}

export const UseRichTextEditorHook: Story = {
  name: "useRichTextEditor — In-tree Control",
  parameters: {
    docs: {
      description: {
        story:
          "`useRichTextEditor()` is called from inside the editor's children. Returns the editor instance plus getter/setter helpers: `setMarkdown`, `setHtml`, `setJson`, `getMarkdown`, `getHtml`, `getJson`, `getText`, `clear`, `focus`.",
      },
      source: {
        code: `import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  useRichTextEditor,
} from "eglador-ui-react-rich-text";

function TemplateButtons() {
  const { setMarkdown, clear } = useRichTextEditor();
  return (
    <div>
      <button onClick={() => setMarkdown("# Hello\\n\\nWorld")}>
        Load template
      </button>
      <button onClick={clear}>Clear</button>
    </div>
  );
}

export function MyEditor() {
  return (
    <RichTextEditor>
      <RichTextToolbar />
      <TemplateButtons />
      <RichTextContent />
    </RichTextEditor>
  );
}`,
      },
    },
  },
  render: () => (
    <div className="max-w-2xl">
      <RichTextEditor>
        <RichTextToolbar />
        <TemplateButtons />
        <RichTextContent placeholder="Click the buttons above to load templates..." />
      </RichTextEditor>
    </div>
  ),
};

// ─── Legacy CMS components — fully generic, schema-driven ───────────────
//
// Nothing here is built into the library. The host app owns the schema
// (which types exist, what fields each one has) and hands it to
// `createLegacyComponentBlocks()`. The result is just more `BlockSpec`s —
// they show up in the toolbar's Insert "+" menu and the inline "/" menu
// exactly like Image, YouTube, etc. Swap this array for any other set of
// types/fields and the popups, validation and `#type#field#value#`
// output adapt automatically.

const MY_CMS_SCHEMA: LegacyComponentSpec[] = [
  {
    type: "resim",
    title: "Image",
    description: "#resim#345456#",
    // No field name in the output, just the value — e.g. submitting
    // ID "345456" renders `#resim#345456#` instead of the default
    // `#resim#ID#345456#`.
    template: "#{type}#{ID}#",
    fields: [{ name: "ID", label: "Image ID", inputType: "text", placeholder: "345456" }],
  },
  {
    type: "video",
    title: "Video",
    description: "#video#ID#value#",
    template: "#{type}#{ID}#",
    fields: [{ name: "ID", label: "Video ID", inputType: "text", placeholder: "913597" }],
  },
  {
    type: "baslik",
    title: "Heading",
    template: "#{type}#{fontsize}#{text}#{alignment}#",
    fields: [
      { name: "fontsize", label: "Size (px)", inputType: "number", placeholder: "26" },
      { name: "text", label: "Text", inputType: "text" },
      {
        name: "alignment",
        label: "Alignment",
        inputType: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
];

const legacyBlocks = createLegacyComponentBlocks(MY_CMS_SCHEMA);
const blocksWithLegacy = [...defaultBlocks, ...legacyBlocks];

/** Same generic `{ type, fields }` shape — handed to `importLegacyComponents()`
 *  for bulk insertion instead of going through the Insert/slash popups. */
const SAMPLE_ITEMS: LegacyComponentInput[] = [
  { type: "resim", fields: { ID: "345456" } },
  { type: "video", fields: { ID: "913597" } },
];

function LegacyComponentsDemo() {
  const { importLegacyComponents, getLegacyShortcodes, clear } =
    useRichTextEditor();
  const [shortcodes, setShortcodes] = React.useState<string[]>([]);

  return (
    <div className="space-y-3">
      <RichTextToolbar insertBlocks={legacyBlocks} />

      <div className="flex flex-wrap gap-2 px-2 py-1.5 border-b border-zinc-200 bg-zinc-50">
        <button
          type="button"
          onClick={() => importLegacyComponents(SAMPLE_ITEMS, MY_CMS_SCHEMA)}
          className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
        >
          Bulk-import sample array
        </button>
        <button
          type="button"
          onClick={() => setShortcodes(getLegacyShortcodes())}
          className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
        >
          Export shortcodes
        </button>
        <button
          type="button"
          onClick={() => {
            clear();
            setShortcodes([]);
          }}
          className="px-3 py-1 text-sm bg-white border border-zinc-200 hover:border-zinc-400 rounded cursor-pointer"
        >
          Clear
        </button>
      </div>

      <RichTextContent placeholder="Type “/” for the inline menu, use the Insert “+” above, or click “Bulk-import”..." />
      <RichTextSlashCommands blocks={blocksWithLegacy} />
      <RichTextOutput />
      {shortcodes.length > 0 && (
        <pre className="text-xs bg-zinc-50 border border-zinc-200 rounded p-3 max-h-64 overflow-auto whitespace-pre-wrap">
          {shortcodes.join("\n")}
        </pre>
      )}
    </div>
  );
}

export const LegacyComponentsGenericSchema: Story = {
  name: "Legacy Components — Generic Schema",
  parameters: {
    docs: {
      description: {
        story:
          "The library has no built-in notion of `video`/`image`/etc. — `createLegacyComponentBlocks(schema)` turns *your own* `LegacyComponentSpec[]` into `BlockSpec`s that appear in the toolbar Insert “+” menu and the inline “/” menu, each opening a form built from that type's field list. Selecting one inserts the literal shortcode string at the cursor — by default `#type#field#value#field#value#`, or your own layout via `spec.template` (e.g. `\"#{type}#{ID}#\"` → `#resim#345456#`, dropping the field name). `importLegacyComponents()` / `getLegacyShortcodes()` do the same bulk, for array-in / array-out integration — pass the same `schema` to `importLegacyComponents()` so its `template`s are honored too.",
      },
      source: {
        code: `import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextSlashCommands,
  defaultBlocks,
  createLegacyComponentBlocks,
  type LegacyComponentSpec,
} from "eglador-ui-react-rich-text";

// Entirely up to you — any types, any fields.
const schema: LegacyComponentSpec[] = [
  {
    type: "resim",
    title: "Image",
    fields: [{ name: "ID", label: "Image ID", inputType: "text" }],
    // Optional — omit for the default "#resim#ID#345456#" layout.
    template: "#{type}#{ID}#",
  },
];

const blocks = [...defaultBlocks, ...createLegacyComponentBlocks(schema)];

export function MyEditor() {
  return (
    <RichTextEditor>
      <RichTextToolbar insertBlocks={blocks} />
      <RichTextContent />
      <RichTextSlashCommands blocks={blocks} />
    </RichTextEditor>
  );
  // Selecting "Image" + filling ID "345456" inserts: #resim#345456#
}`,
      },
    },
  },
  render: () => (
    <div className="max-w-2xl">
      <RichTextEditor>
        <LegacyComponentsDemo />
      </RichTextEditor>
    </div>
  ),
};

// ─── editorRef — external control ────────────

function ExternalControlDemo() {
  const editorRef = React.useRef<LexicalEditor | null>(null);
  const [snapshot, setSnapshot] = React.useState("");

  const captureMarkdown = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.read(() => {
      setSnapshot($convertToMarkdownString(TRANSFORMERS));
    });
  };

  return (
    <div className="space-y-4">
      <RichTextEditor editorRef={editorRef}>
        <RichTextToolbar />
        <RichTextContent placeholder="Type something, then snapshot below..." />
      </RichTextEditor>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={captureMarkdown}
          className="px-4 py-2 bg-zinc-900 text-white rounded font-medium cursor-pointer"
        >
          Snapshot Markdown
        </button>
        <button
          type="button"
          onClick={() => editorRef.current?.focus()}
          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded font-medium cursor-pointer"
        >
          Focus editor
        </button>
      </div>

      {snapshot && (
        <pre className="text-xs bg-zinc-50 border border-zinc-200 rounded p-3 max-h-40 overflow-auto whitespace-pre-wrap">
          {snapshot}
        </pre>
      )}
    </div>
  );
}

export const EditorRef: Story = {
  name: "editorRef — External Control",
  parameters: {
    docs: {
      description: {
        story:
          "Use the `editorRef` prop to expose the LexicalEditor instance outside the component tree. Ideal for controlling the editor from outside its children (e.g. a form submit handler).",
      },
      source: {
        code: `import { useRef } from "react";
import type { LexicalEditor } from "lexical";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
} from "eglador-ui-react-rich-text";

export function MyEditor() {
  const editorRef = useRef<LexicalEditor | null>(null);

  const handleSubmit = () => {
    editorRef.current?.read(() => {
      // Access state
    });
  };

  return (
    <>
      <RichTextEditor editorRef={editorRef}>
        <RichTextToolbar />
        <RichTextContent />
      </RichTextEditor>
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}`,
      },
    },
  },
  render: () => (
    <div className="max-w-2xl">
      <ExternalControlDemo />
    </div>
  ),
};
