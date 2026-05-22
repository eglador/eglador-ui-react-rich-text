import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextPageSize,
  RichTextOutput,
  RichTextSlashCommands,
  RichTextAutoEmbed,
  RichTextStats,
  RichTextFindReplace,
  defaultBlocks,
  type RichTextToolbarFeature,
  type HeadingMenuItem,
} from "../components/rich-text";

const HEADING_ITEM_OPTIONS: HeadingMenuItem[] = [
  "paragraph",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
];

/** Keys of every block in the registry — used as the controls panel
 *  option list. Toggling a key off filters that block out of every
 *  surface (Insert dropdown, slash menu, draggable + menu). */
const ALL_BLOCK_KEYS: string[] = defaultBlocks.map((b) => b.key);

const FEATURE_OPTIONS: RichTextToolbarFeature[] = [
  "undo",
  "redo",
  "heading",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "code",
  "textTransform",
  "textColor",
  "backgroundColor",
  "bulletList",
  "orderedList",
  "checkList",
  "alignment",
  "quote",
  "link",
  "insert",
];

const FEATURE_GROUPS: RichTextToolbarFeature[][] = [
  ["undo", "redo"],
  ["heading"],
  ["bold", "italic", "underline", "strikethrough", "code"],
  ["textTransform"],
  ["textColor", "backgroundColor"],
  ["bulletList", "orderedList", "checkList"],
  ["alignment"],
  ["quote", "link"],
  ["insert"],
];

/** Insert separators between active feature groups so the toolbar mirrors
 *  the default visual grouping when users toggle features individually. */
function buildFeatures(
  selected: RichTextToolbarFeature[],
): RichTextToolbarFeature[] {
  const set = new Set(selected);
  const out: RichTextToolbarFeature[] = [];
  for (const group of FEATURE_GROUPS) {
    const active = group.filter((f) => set.has(f));
    if (active.length === 0) continue;
    if (out.length > 0) out.push("separator");
    out.push(...active);
  }
  return out;
}

type PlaygroundArgs = {
  // Editor
  editable: boolean;
  autoFocus: boolean;
  // Limit
  maxLength: number;
  charset: "UTF-8" | "UTF-16";
  // Slots
  showToolbar: boolean;
  showPageSize: boolean;
  showOutput: boolean;
  showSlashCommands: boolean;
  showAutoEmbed: boolean;
  showStats: boolean;
  statsReadingTime: boolean;
  showFindReplace: boolean;
  // Content
  mode: "rich" | "plain";
  placeholder: string;
  minHeight: string;
  draggable: boolean;
  floatingToolbar: boolean;
  // Toolbar features
  features: RichTextToolbarFeature[];
  headingItems: HeadingMenuItem[];
  enabledBlockKeys: string[];
  // Initial content
  initialHtml: string;
};

const INITIAL_HTML = `<h1 style="text-align: center">The Art of Rich Text Editing</h1>
<p style="text-align: center"><em>A practical guide to building modern document experiences with <span style="color: #3b82f6">Lexical</span> and <span style="color: #06b6d4">React</span></em></p>
<p style="text-align: center">By <strong>Jane Doe</strong> · Published <a href="https://lexical.dev" target="_blank" rel="noopener noreferrer">on Lexical Journal</a> · 8 min read</p>
<hr />
<p style="text-align: justify"><strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Modern editors go <mark>far beyond simple text areas</mark> — they deliver <em>structured content</em>, <u>rich formatting</u>, and <span style="color: #8b5cf6">co-authoring</span> experiences. This article walks through the core principles behind a production-grade rich text editor.</p>
<h2>Why Rich Text Matters</h2>
<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. A <span style="background-color: #fef08a">structural editor</span> gives the user more than a writing surface — it gives them a <strong>thinking</strong> tool. <span style="color: #ef4444">Duis aute irure dolor</span> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
<blockquote>"The best tool gets out of your way and lets ideas flow. Rich text editors should feel like an extension of thought, not a barrier to it." — <em>Jakob Nielsen</em>, Nielsen Norman Group</blockquote>
<h3>Key Capabilities</h3>
<p>A modern editor is expected to provide these core capabilities:</p>
<ul>
  <li><strong>Block-level editing</strong> — blocks that can be reordered with drag-and-drop</li>
  <li><em>Inline formatting</em> — bold, italic, underline, <s>strikethrough</s>, <code>inline code</code>, and more</li>
  <li><span style="background-color: #bbf7d0">Markdown shortcuts</span> — <code>**bold**</code>, <code># heading</code>, <code>- list</code></li>
  <li>HTML / JSON / Markdown <span style="color: #22c55e">round-trip</span> serialization</li>
  <li>Collaborative-ready architecture <span style="color: #71717a">(coming soon)</span></li>
</ul>
<h3>Architecture Overview</h3>
<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. The system is built on three fundamental <code>primitives</code>:</p>
<ol>
  <li><strong>EditorState</strong> — the single immutable source of truth</li>
  <li><strong>Nodes</strong> — extensible content blocks (heading, list, table, custom…)</li>
  <li><strong>Commands</strong> — declarative operations over the current selection</li>
</ol>
<pre><code>function useEditor() {
  const [state, setState] = useState(initialState);
  const dispatch = (cmd, payload) => {
    setState(reduce(state, cmd, payload));
  };
  return { state, dispatch };
}</code></pre>
<h2>Performance Benchmarks</h2>
<p style="text-align: justify">Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. <strong>Real-world measurements</strong> show the practical impact of architectural choices:</p>
<table>
  <tr>
    <th>Metric</th>
    <th>Lexical</th>
    <th>Slate</th>
    <th>ProseMirror</th>
  </tr>
  <tr>
    <td>Bundle (gzip)</td>
    <td><span style="color: #22c55e"><strong>22 KB</strong></span></td>
    <td>34 KB</td>
    <td>45 KB</td>
  </tr>
  <tr>
    <td>Time to interactive</td>
    <td><span style="color: #22c55e"><strong>120 ms</strong></span></td>
    <td>180 ms</td>
    <td>200 ms</td>
  </tr>
  <tr>
    <td>Memory (1k blocks)</td>
    <td><span style="color: #22c55e"><strong>8 MB</strong></span></td>
    <td>14 MB</td>
    <td>11 MB</td>
  </tr>
  <tr>
    <td>Plugin ecosystem</td>
    <td>Growing</td>
    <td>Mature</td>
    <td>Mature</td>
  </tr>
</table>
<p style="text-align: center"><em>Measurements: Chrome 120, MacBook Pro M2 — <a href="https://github.com" target="_blank" rel="noopener noreferrer">methodology</a></em></p>
<h2>Mathematical & Scientific Notation</h2>
<p>Editors should handle not only plain prose but also <strong>scientific notation</strong>.</p>
<p><strong>Chemistry:</strong> Water has the molecular formula H<sub>2</sub>O. The combustion reaction: 2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O. <span style="background-color: #fef08a">Glucose</span>: C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>.</p>
<p><strong>Physics:</strong> Einstein's mass-energy equivalence E = mc<sup>2</sup> reshaped our understanding of the universe. Pythagoras: a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>. A cubic polynomial: x<sup>3</sup> + 2x<sup>2</sup> − 5x + 1.</p>
<hr />
<h2>API Reference</h2>
<p>This section demonstrates deep heading levels — h4/h5/h6 are common in extensive documentation.</p>
<h3>Components</h3>
<h4>RichTextEditor</h4>
<p>The root component that wraps Lexical's composer.</p>
<h5>Configuration</h5>
<p>It consumes <code>initialConfig</code> once when the editor mounts.</p>
<h6>Theme tokens</h6>
<p>Lexical's <code>EditorThemeClasses</code> map assigns class names to node types — blended with <span style="color: #8b5cf6">Tailwind v4</span>.</p>
<h2>Layout & Typography</h2>
<p>Alignment is a core typography primitive. The examples below illustrate the four modes:</p>
<p style="text-align: left"><strong>Left-aligned:</strong> Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.</p>
<p style="text-align: center"><strong>Centered:</strong> Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae.</p>
<p style="text-align: right"><strong>Right-aligned:</strong> Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias.</p>
<p style="text-align: justify"><strong>Justified:</strong> At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.</p>
<h2>Conclusion</h2>
<p style="text-align: justify">Et harum quidem <mark>rerum facilis est</mark> et <span style="color: #8b5cf6"><strong>expedita distinctio</strong></span>. Building a modern rich text editor requires a careful balance of <em>state management</em>, <em>DOM serialization</em>, and <em>UX details</em>. Lexical brings the three together through an elegant API.</p>
<blockquote><strong>Takeaway:</strong> The best editor is one that gets out of the user's way. Thoughts should flow; the tool should disappear into the <span style="background-color: #fef08a">flow</span>.</blockquote>
<p style="text-align: center"><em>If you enjoyed this article, visit the <a href="https://lexical.dev" target="_blank" rel="noopener noreferrer">Lexical documentation</a> and <a href="https://github.com" target="_blank" rel="noopener noreferrer">star us on GitHub</a>. ★</em></p>
<p>Embed examples — you can also insert via the Insert menu or by pasting a URL directly (YouTube, .mp3, .mp4 URLs are detected automatically):</p>`;

const meta: Meta<PlaygroundArgs> = {
  title: "Rich Text/Playground",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Master playground for live-testing every feature in one place. Use the Controls panel to tweak editor behavior, slots (toolbar, page size), content props (draggable, floatingToolbar), the toolbar feature selection, and the initial content.",
      },
    },
  },
  args: {
    editable: true,
    autoFocus: false,
    maxLength: 0,
    charset: "UTF-16",
    showToolbar: true,
    showPageSize: true,
    showOutput: false,
    showSlashCommands: true,
    showAutoEmbed: true,
    showStats: true,
    statsReadingTime: false,
    showFindReplace: true,
    mode: "rich",
    placeholder: "Start writing... or press / for commands",
    minHeight: "min-h-32",
    draggable: true,
    floatingToolbar: true,
    features: [...FEATURE_OPTIONS],
    headingItems: [...HEADING_ITEM_OPTIONS],
    enabledBlockKeys: [...ALL_BLOCK_KEYS],
    initialHtml: INITIAL_HTML,
  },
  argTypes: {
    // ── Editor ───────────────────────────
    editable: { control: "boolean", table: { category: "Editor" } },
    autoFocus: { control: "boolean", table: { category: "Editor" } },
    // ── Limit ────────────────────────────
    maxLength: {
      control: { type: "number", min: 0, max: 10000, step: 50 },
      table: { category: "Limit" },
      description:
        "Character limit. `0` = unlimited. When the limit is exceeded, the overflow text is wrapped in a red-background OverflowNode.",
    },
    charset: {
      control: "radio",
      options: ["UTF-8", "UTF-16"],
      table: { category: "Limit" },
      description:
        "Character counting mode. UTF-16 = `String.length`. UTF-8 = multi-byte counting for emoji/CJK.",
      if: { arg: "maxLength", neq: 0 },
    },
    // ── Slots ────────────────────────────
    showToolbar: {
      control: "boolean",
      name: "Toolbar",
      table: { category: "Slots" },
    },
    showPageSize: {
      control: "boolean",
      name: "Page size bar",
      table: { category: "Slots" },
    },
    showOutput: {
      control: "boolean",
      name: "Output panel",
      table: { category: "Slots" },
      description:
        "Live HTML/Markdown/JSON/Text output panel below the editor (subscribes via onChange).",
    },
    showSlashCommands: {
      control: "boolean",
      name: "Slash commands",
      table: { category: "Slots" },
      description:
        "Notion-style command menu that opens when you type `/` (for inserting blocks).",
    },
    showAutoEmbed: {
      control: "boolean",
      name: "Auto embed",
      table: { category: "Slots" },
      description:
        "Auto-detects pasted/typed URLs (YouTube, etc.) and suggests an embed.",
    },
    showStats: {
      control: "boolean",
      name: "Stats bar",
      table: { category: "Slots" },
      description:
        "Shows live word + character count below the editor (a modern editor standard).",
    },
    statsReadingTime: {
      control: "boolean",
      name: "+ Reading time",
      table: { category: "Slots" },
      description:
        "Adds an estimated reading time to the stats bar (200 wpm).",
      if: { arg: "showStats", truthy: true },
    },
    showFindReplace: {
      control: "boolean",
      name: "Find & Replace",
      table: { category: "Slots" },
      description:
        "Find & replace panel triggered by Cmd/Ctrl+F (a modern editor standard).",
    },
    // ── Content ──────────────────────────
    mode: {
      control: "radio",
      options: ["rich", "plain"],
      table: { category: "Content" },
      description:
        "`plain` = plain text only (PlainTextPlugin). The toolbar still renders but format commands become no-ops.",
    },
    placeholder: { control: "text", table: { category: "Content" } },
    minHeight: {
      control: "text",
      table: { category: "Content" },
      description: "Tailwind min-height class (e.g. `min-h-32`, `min-h-96`)",
    },
    draggable: {
      control: "boolean",
      table: { category: "Content" },
      description: "Notion-style drag handle + (+) insert menu",
    },
    floatingToolbar: {
      control: "boolean",
      table: { category: "Content" },
      description: "Mini formatting bar above the selection",
    },
    // ── Toolbar features ─────────────────
    features: {
      control: "check",
      options: FEATURE_OPTIONS,
      table: { category: "Toolbar features" },
      description:
        "Features visible in the toolbar. Separators are inserted between active groups automatically.",
      if: { arg: "showToolbar", truthy: true },
    },
    // ── Heading dropdown ─────────────────
    headingItems: {
      control: "check",
      options: HEADING_ITEM_OPTIONS,
      table: { category: "Heading dropdown" },
      description:
        "Block types shown inside the heading dropdown (only effective while the `heading` feature is active).",
      if: { arg: "showToolbar", truthy: true },
    },
    // ── Blocks ───────────────────────────
    enabledBlockKeys: {
      control: "check",
      options: ALL_BLOCK_KEYS,
      name: "Enabled blocks",
      table: { category: "Blocks" },
      description:
        "Block keys selected from the registry. The filter applies to all three surfaces at once — Insert dropdown, slash menu (`/`), and the draggable `+` menu. Turning a block off hides it everywhere.",
    },
    // ── Initial content ──────────────────
    initialHtml: {
      control: "text",
      table: { category: "Initial content" },
      description:
        "HTML parsed when the editor mounts. More expressive than Markdown — supports color, alignment, tables, sub/sup, etc.",
    },
  },
};

export default meta;

function PlaygroundDemo(args: PlaygroundArgs) {
  // Single source of truth — the same filtered registry feeds all three
  // surfaces (Insert dropdown, slash menu, draggable + menu) so toggling
  // a block off in controls removes it everywhere.
  const enabledBlocks = React.useMemo(
    () =>
      defaultBlocks.filter((b) => args.enabledBlockKeys.includes(b.key)),
    [args.enabledBlockKeys],
  );

  return (
    <div className="max-w-5xl">
      <RichTextEditor
        editable={args.editable}
        autoFocus={args.autoFocus}
        initialHtml={args.initialHtml}
        maxLength={args.maxLength > 0 ? args.maxLength : undefined}
        charset={args.charset}
        // Re-mount when initial content or mode changes so editor reflects the new value
        key={`${args.initialHtml}-${args.mode}`}
      >
        {args.showToolbar && (
          <RichTextToolbar
            features={buildFeatures(args.features)}
            headingItems={args.headingItems}
            insertBlocks={enabledBlocks}
          />
        )}
        <RichTextContent
          mode={args.mode}
          placeholder={args.placeholder}
          minHeight={args.minHeight}
          draggable={args.draggable}
          draggableBlocks={enabledBlocks}
          floatingToolbar={args.floatingToolbar}
        />
        {args.showSlashCommands && (
          <RichTextSlashCommands blocks={enabledBlocks} />
        )}
        {args.showAutoEmbed && <RichTextAutoEmbed />}
        {args.showStats && (
          <RichTextStats showReadingTime={args.statsReadingTime} />
        )}
        {args.showFindReplace && <RichTextFindReplace />}
        {args.showPageSize && <RichTextPageSize />}
        {args.showOutput && <RichTextOutput />}
      </RichTextEditor>
    </div>
  );
}

export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => <PlaygroundDemo {...args} />,
};
