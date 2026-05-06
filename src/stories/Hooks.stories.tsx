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
  useRichTextEditor,
} from "../components/rich-text";

const meta: Meta = {
  title: "Rich Text/Hooks",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Programatik kontrol için iki yol: `useRichTextEditor()` hook (Carousel children'ı içinde) veya `editorRef` prop (dışarıdan).",
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
          "`useRichTextEditor()` Carousel children'ından çağrılır. Editor instance + getter/setter helpers döner: `setMarkdown`, `setHtml`, `setJson`, `getMarkdown`, `getHtml`, `getJson`, `getText`, `clear`, `focus`.",
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
          "`editorRef` prop'u ile LexicalEditor instance'ını dışarıya sızdır. RichTextEditor children'ı dışından kontrol etmek için ideal (örn. form submit handler).",
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
