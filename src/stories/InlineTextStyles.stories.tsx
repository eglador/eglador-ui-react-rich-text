import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextOutput,
  useRichTextEditor,
  decodeTextFormat,
  parseCssText,
} from "../components/rich-text";

/**
 * Built as JSON rather than HTML on purpose. Lexical's HTML importer
 * (`applyTextFormatFromStyle`) only reads `font-weight`,
 * `text-decoration`, `font-style` and `vertical-align` off a `<span>` —
 * `color` and `background-color` are dropped. `initialJson` carries the
 * node's `style` verbatim, which is exactly what this story is about.
 */
const text = (text: string, format = 0, style = "") => ({
  type: "text",
  text,
  format,
  style,
  detail: 0,
  mode: "normal",
  version: 1,
});

const block = (type: string, children: unknown[], tag?: string) => ({
  type,
  ...(tag ? { tag } : {}),
  children,
  direction: "ltr",
  format: "",
  indent: 0,
  version: 1,
  ...(type === "paragraph" ? { textFormat: 0, textStyle: "" } : {}),
});

const INITIAL_JSON = JSON.stringify({
  root: {
    type: "root",
    children: [
      block("heading", [text("Biçimlendirilmiş metin")], "h2"),
      block("paragraph", [
        text("Düz metin, "),
        text("kalın", 1),
        text(", "),
        text("italik", 2),
        text(", "),
        text("altı çizili", 8),
        text(", "),
        text("üstü çizili", 4),
        text(", "),
        text("kalın + altı çizili", 1 | 8),
        text(", "),
        text("altı + üstü çizili", 4 | 8),
        text(", "),
        text("kod", 16),
        text(", "),
        text("vurgulu", 128),
        text(", "),
        text("kırmızı", 0, "color: #ef4444;"),
        text(", "),
        text("mavi zemin", 0, "background-color: #bfdbfe;"),
        text(", "),
        text("kalın mor", 1, "color: #8b5cf6;"),
        text("."),
      ]),
      block("paragraph", [
        text("Bilimsel gösterim: H"),
        text("2", 32),
        text("O ve E = mc"),
        text("2", 64),
        text("."),
      ]),
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    version: 1,
  },
});

// ─── serialized-state helpers ────────────────────────────────────

interface TextNodeJson {
  type: string;
  text: string;
  format: number;
  style: string;
  css?: string;
}

interface BlockJson {
  type: string;
  tag?: string;
  children?: unknown[];
}

/** Collect every text node, in document order. */
function collectTextNodes(node: unknown, out: TextNodeJson[] = []): TextNodeJson[] {
  if (Array.isArray(node)) {
    for (const child of node) collectTextNodes(child, out);
    return out;
  }
  if (!node || typeof node !== "object") return out;
  const record = node as Record<string, unknown>;
  if (record.type === "text" && typeof record.text === "string") {
    out.push(record as unknown as TextNodeJson);
  }
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") collectTextNodes(value, out);
  }
  return out;
}

/** `"font-weight: 700; color: red"` → `{ fontWeight: "700", color: "red" }` */
function cssToReactStyle(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const [prop, value] of Object.entries(parseCssText(css))) {
    out[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out as React.CSSProperties;
}

const BLOCK_TAG: Record<string, keyof React.JSX.IntrinsicElements> = {
  paragraph: "p",
  quote: "blockquote",
};

/**
 * Renders a serialized state using **only** each text node's `css`
 * string — no Lexical, no theme, no knowledge of the format bitmask.
 * This is the "consumer" side: if it matches the editor above, the
 * styling survived the trip.
 */
function RenderFromCss({ state }: { state: unknown }) {
  const root = (state as { root?: BlockJson }).root;
  if (!root?.children) return null;

  return (
    <div className="space-y-2">
      {root.children.map((block, i) => {
        const b = block as BlockJson;
        const Tag = (b.type === "heading"
          ? (b.tag ?? "h2")
          : (BLOCK_TAG[b.type] ?? "p")) as keyof React.JSX.IntrinsicElements;
        const runs = (b.children ?? []) as TextNodeJson[];
        return (
          <Tag key={i}>
            {runs.map((run, j) =>
              run.type === "text" ? (
                <span key={j} style={run.css ? cssToReactStyle(run.css) : undefined}>
                  {run.text}
                </span>
              ) : null,
            )}
          </Tag>
        );
      })}
    </div>
  );
}

// ─── the panel ───────────────────────────────────────────────────

function StyleInspector() {
  const { editor, getRawJson, getJson } = useRichTextEditor();
  const [raw, setRaw] = React.useState<unknown>(null);
  const [styled, setStyled] = React.useState<unknown>(null);

  React.useEffect(() => {
    const update = () => {
      // `getJson()` already carries `css`; `getRawJson()` is the
      // untouched Lexical shape, shown here for comparison.
      setRaw(JSON.parse(getRawJson()));
      setStyled(JSON.parse(getJson()));
    };
    update();
    return editor.registerUpdateListener(update);
  }, [editor, getRawJson, getJson]);

  if (!styled) return null;

  const rows = collectTextNodes(styled).filter((n) => n.text.trim().length > 0);
  const sample = collectTextNodes(styled).find((n) => n.format !== 0);

  return (
    <div className="space-y-4 border-t border-zinc-200 p-4">
      <section>
        <h3 className="mb-1 text-sm font-semibold text-zinc-900">
          1. Ham JSON — sayı ne anlama geliyor?
        </h3>
        <p className="mb-2 text-xs text-zinc-600">
          <code>format</code> bir bit maskesi:{" "}
          bold&nbsp;1 · italic&nbsp;2 · strikethrough&nbsp;4 · underline&nbsp;8 ·
          code&nbsp;16 · subscript&nbsp;32 · superscript&nbsp;64 ·
          highlight&nbsp;128. Renk ve zemin ayrı bir <code>style</code> alanında.
        </p>
        <div className="max-h-56 overflow-auto rounded border border-zinc-200">
          <table className="w-full text-left text-[11px]">
            <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-2 py-1 font-medium">metin</th>
                <th className="px-2 py-1 font-medium">format</th>
                <th className="px-2 py-1 font-medium">çözümü</th>
                <th className="px-2 py-1 font-medium">style</th>
                <th className="px-2 py-1 font-medium text-emerald-700">
                  css (türetilen)
                </th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((n, i) => (
                <tr key={i} className="border-t border-zinc-100 align-top">
                  <td className="max-w-[8rem] truncate px-2 py-1">{n.text}</td>
                  <td className="px-2 py-1 tabular-nums text-zinc-500">
                    {n.format}
                  </td>
                  <td className="px-2 py-1 text-zinc-600">
                    {decodeTextFormat(n.format).join(" + ") || "—"}
                  </td>
                  <td className="px-2 py-1 text-zinc-500">{n.style || "—"}</td>
                  <td className="px-2 py-1 text-emerald-800">{n.css ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {sample && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-zinc-900">
            2. Aynı düğüm, iki çıktı
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <pre className="overflow-auto rounded border border-zinc-200 bg-zinc-50 p-2 text-[11px]">
              {`// getRawJson()\n${JSON.stringify(
                {
                  type: "text",
                  text: sample.text,
                  format: sample.format,
                  style: sample.style,
                },
                null,
                2,
              )}`}
            </pre>
            <pre className="overflow-auto rounded border border-emerald-200 bg-emerald-50 p-2 text-[11px]">
              {`// getJson()  ← API'ye giden\n${JSON.stringify(
                {
                  type: "text",
                  text: sample.text,
                  format: sample.format,
                  style: sample.style,
                  css: sample.css,
                },
                null,
                2,
              )}`}
            </pre>
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-sm font-semibold text-zinc-900">
          3. Uygulanmış hâli
        </h3>
        <p className="mb-2 text-xs text-zinc-600">
          Aşağısı editörden değil — yalnızca her düğümün <code>css</code>{" "}
          metni <code>&lt;span style&gt;</code>’e verilerek çizildi. Lexical,
          tema veya bit maskesi bilgisi kullanılmadı. Yukarıdaki editörle aynı
          görünüyorsa biçimlendirme yolculuğu sağlam demektir.
        </p>
        <div className="rounded border border-dashed border-emerald-300 bg-white p-3">
          <RenderFromCss state={styled} />
        </div>
      </section>

      {raw != null && (
        <p className="text-[11px] text-zinc-400">
          Editörde metni seçip biçimlendirmeyi değiştir — tablo, JSON ve
          uygulanmış hâl anlık güncellenir.
        </p>
      )}
    </div>
  );
}

const meta: Meta = {
  title: "Rich Text/Inline Text Styles",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Lexical splits inline formatting in two: `format` is a **bitmask** (bold 1, italic 2, strikethrough 4, underline 8, code 16, subscript 32, superscript 64, highlight 128, …) and `style` is a CSS string holding colour/background. Consuming that downstream means decoding the bitmask by hand.\n\n`withInlineTextStyles()` — or `useRichTextEditor().getStyledJson()` — adds a ready-to-use `css` key to every text node that merges both halves.\n\n**Heads-up on `initialHtml`:** Lexical's HTML importer only reads `font-weight`, `text-decoration`, `font-style` and `vertical-align` off a `<span style>`. `color` and `background-color` are **dropped on import** — so `<span style=\"color:#ef4444\">` comes back as plain text. Colours picked in the toolbar (which write the node's `style` directly) and content loaded via `initialJson` are unaffected. This story is seeded from JSON for that reason.",
      },
    },
  },
};

export default meta;

export const Inspector: StoryObj = {
  name: "css alanı — çözümü ve uygulanışı",
  parameters: {
    docs: {
      description: {
        story:
          "Edit the text above and watch the three panels update: the decoded bitmask table, the same node with and without `css`, and a preview rendered **only** from the `css` strings.\n\nNote `underline + strikethrough` collapsing into a single `text-decoration` (two declarations would overwrite each other), and an explicitly picked background beating `highlight`'s default yellow.",
      },
      source: {
        code: `import { withInlineTextStyles, parseCssText } from "eglador-ui-react-rich-text";

// 1 — get the JSON with a ready-to-use css string per text node
const json = withInlineTextStyles(JSON.parse(editorRef.current.getJson()));
// or, from inside the editor: useRichTextEditor().getStyledJson()

// 2 — render it without knowing anything about the format bitmask
const toReactStyle = (css) =>
  Object.fromEntries(
    Object.entries(parseCssText(css)).map(([k, v]) => [
      k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ]),
  );

json.root.children.map((block, i) => (
  <p key={i}>
    {block.children.map((run, j) => (
      <span key={j} style={run.css ? toReactStyle(run.css) : undefined}>
        {run.text}
      </span>
    ))}
  </p>
));`,
      },
    },
  },
  render: () => (
    <div className="max-w-4xl">
      <RichTextEditor initialJson={INITIAL_JSON}>
        <RichTextToolbar />
        <RichTextContent floatingToolbar minHeight="min-h-32" />
        <StyleInspector />
        {/* `inlineTextStyles` makes the JSON tab show the derived `css`
            key; without it the panel prints the raw `format` bitmask. */}
        <RichTextOutput defaultTab="json" maxHeight="max-h-80" />
      </RichTextEditor>
    </div>
  ),
};
