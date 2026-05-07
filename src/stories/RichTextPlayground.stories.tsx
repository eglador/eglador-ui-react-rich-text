import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextPageSize,
  RichTextSlashCommands,
  RichTextAutoEmbed,
  defaultBlocks,
  type RichTextToolbarFeature,
  type RichTextValue,
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
<p style="text-align: justify"><strong>Lorem ipsum dolor sit amet</strong>, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Modern editörler <mark>basit metin alanlarının</mark> çok ötesinde — onlar <em>yapısal içerik</em>, <u>zengin formatlamalar</u> ve <span style="color: #8b5cf6">co-authoring</span> deneyimleri sunar. Bu makalede, üretim kalitesinde bir rich text editörünün nasıl tasarlandığına dair temel ilkeleri inceleyeceğiz.</p>
<h2>Why Rich Text Matters</h2>
<p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. <span style="background-color: #fef08a">Yapısal düzenleyici</span>, kullanıcıya yalnızca yazma değil — <strong>düşünme</strong> aracı verir. <span style="color: #ef4444">Duis aute irure dolor</span> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
<blockquote>"The best tool gets out of your way and lets ideas flow. Rich text editors should feel like an extension of thought, not a barrier to it." — <em>Jakob Nielsen</em>, Nielsen Norman Group</blockquote>
<h3>Key Capabilities</h3>
<p>Modern bir editörden beklenen temel yetenekler şunlardır:</p>
<ul>
  <li><strong>Block-level editing</strong> — drag-and-drop ile yeniden sıralanabilir bloklar</li>
  <li><em>Inline formatting</em> — bold, italic, underline, <s>strikethrough</s>, <code>inline code</code> ve daha fazlası</li>
  <li><span style="background-color: #bbf7d0">Markdown shortcut'ları</span> — <code>**bold**</code>, <code># heading</code>, <code>- list</code></li>
  <li>HTML / JSON / Markdown <span style="color: #22c55e">round-trip</span> serialization</li>
  <li>Collaborative-ready mimari <span style="color: #71717a">(yakında)</span></li>
</ul>
<h3>Architecture Overview</h3>
<p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium. Sistem üç temel <code>primitive</code> üzerine kuruludur:</p>
<ol>
  <li><strong>EditorState</strong> — değiştirilemez (immutable) tek doğru kaynak</li>
  <li><strong>Nodes</strong> — genişletilebilir içerik blokları (heading, list, table, custom...)</li>
  <li><strong>Commands</strong> — selection üstünde declarative işlemler</li>
</ol>
<pre><code>function useEditor() {
  const [state, setState] = useState(initialState);
  const dispatch = (cmd, payload) => {
    setState(reduce(state, cmd, payload));
  };
  return { state, dispatch };
}</code></pre>
<h2>Performance Benchmarks</h2>
<p style="text-align: justify">Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. <strong>Gerçek dünya ölçümleri</strong>, mimari kararların pratik etkisini gösterir:</p>
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
<p style="text-align: center"><em>Ölçümler: Chrome 120, MacBook Pro M2 — <a href="https://github.com" target="_blank" rel="noopener noreferrer">methodology</a></em></p>
<h2>Mathematical & Scientific Notation</h2>
<p>Editörler yalnızca düz metin değil, <strong>bilimsel notasyon</strong> da işleyebilmelidir.</p>
<p><strong>Kimya:</strong> Suyun molekül formülü H<sub>2</sub>O. Yanma reaksiyonu: 2H<sub>2</sub> + O<sub>2</sub> → 2H<sub>2</sub>O. <span style="background-color: #fef08a">Glukoz</span>: C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>.</p>
<p><strong>Fizik:</strong> Einstein'ın kütle-enerji denkliği E = mc<sup>2</sup> evrenin yapısı hakkında devrim niteliğindeydi. Pisagor: a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>. Üçüncü dereceden polinom: x<sup>3</sup> + 2x<sup>2</sup> − 5x + 1.</p>
<hr />
<h2>API Reference</h2>
<p>Bu bölüm derin başlık seviyelerini gösterir — kapsamlı dokümantasyonlarda h4/h5/h6 yaygındır.</p>
<h3>Components</h3>
<h4>RichTextEditor</h4>
<p>Lexical composer'ı saran kök bileşen.</p>
<h5>Configuration</h5>
<p>Editör mount olurken <code>initialConfig</code>'i tek seferlik tüketir.</p>
<h6>Theme tokens</h6>
<p>Lexical'in <code>EditorThemeClasses</code> map'i node tiplerine class isimleri atar — <span style="color: #8b5cf6">Tailwind v4</span> ile harmanlanır.</p>
<h2>Layout & Typography</h2>
<p>Hizalama, tipografinin temel bileşenidir. Aşağıdaki örnekler dört modu gösterir:</p>
<p style="text-align: left"><strong>Sola hizalı:</strong> Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.</p>
<p style="text-align: center"><strong>Ortalanmış:</strong> Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae.</p>
<p style="text-align: right"><strong>Sağa hizalı:</strong> Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias.</p>
<p style="text-align: justify"><strong>İki yana yaslı:</strong> At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.</p>
<h2>Conclusion</h2>
<p style="text-align: justify">Et harum quidem <mark>rerum facilis est</mark> et <span style="color: #8b5cf6"><strong>expedita distinctio</strong></span>. Modern bir rich text editörü inşa etmek; <em>state management</em>, <em>DOM serialization</em> ve <em>UX detayları</em>'nın ince dengesini gerektirir. Lexical bu üçünü zarif bir API ile birleştirir.</p>
<blockquote><strong>Sonuç:</strong> En iyi editör, kullanıcının önünden çekilen editördür. Düşünceler akmalı; araç değil, <span style="background-color: #fef08a">akış</span> ön plana çıkmalıdır.</blockquote>
<p style="text-align: center"><em>Bu makaleyi beğendiyseniz, <a href="https://lexical.dev" target="_blank" rel="noopener noreferrer">Lexical dokümantasyonunu</a> ziyaret edin ve <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub'da yıldız</a> bırakın. ★</em></p>
<p>Embed örnekleri — Insert menüsünden veya direkt URL yapıştırarak da ekleyebilirsiniz (YouTube, .mp3, .mp4 URL'leri otomatik tanınır):</p>`;

const meta: Meta<PlaygroundArgs> = {
  title: "Rich Text/Playground",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Tek noktadan tüm özelliklerin canlı test edildiği master playground. Controls panelinden editör davranışı, slot'lar (toolbar, page size), content prop'ları (draggable, floatingToolbar), toolbar feature seçimi ve başlangıç içeriği değiştirilebilir.",
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
        "Karakter limiti. `0` = limitsiz. Limit aşıldığında metin kırmızı arka planlı OverflowNode'a sarılır.",
    },
    charset: {
      control: "radio",
      options: ["UTF-8", "UTF-16"],
      table: { category: "Limit" },
      description:
        "Karakter sayım modu. UTF-16 = `String.length`. UTF-8 = emoji/CJK için multi-byte.",
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
        "Editör altında canlı HTML/Markdown/JSON/Text output paneli (onChange ile)",
    },
    showSlashCommands: {
      control: "boolean",
      name: "Slash commands",
      table: { category: "Slots" },
      description:
        "`/` yazınca açılan Notion-style komut menüsü (block ekleme).",
    },
    showAutoEmbed: {
      control: "boolean",
      name: "Auto embed",
      table: { category: "Slots" },
      description:
        "Yapıştırılan / yazılan URL'i otomatik tanır (YouTube vs.) ve embed önerir.",
    },
    // ── Content ──────────────────────────
    mode: {
      control: "radio",
      options: ["rich", "plain"],
      table: { category: "Content" },
      description:
        "`plain` = sadece düz metin (PlainTextPlugin). Toolbar render olmaya devam ederken format komutları etkisiz olur.",
    },
    placeholder: { control: "text", table: { category: "Content" } },
    minHeight: {
      control: "text",
      table: { category: "Content" },
      description: "Tailwind min-height class (örn. `min-h-32`, `min-h-96`)",
    },
    draggable: {
      control: "boolean",
      table: { category: "Content" },
      description: "Notion-style drag handle + (+) insert menu",
    },
    floatingToolbar: {
      control: "boolean",
      table: { category: "Content" },
      description: "Selection üstünde mini formatting bar",
    },
    // ── Toolbar features ─────────────────
    features: {
      control: "check",
      options: FEATURE_OPTIONS,
      table: { category: "Toolbar features" },
      description:
        "Toolbar'da görünecek feature'lar. Separator'lar otomatik gruplara göre eklenir.",
      if: { arg: "showToolbar", truthy: true },
    },
    // ── Heading dropdown ─────────────────
    headingItems: {
      control: "check",
      options: HEADING_ITEM_OPTIONS,
      table: { category: "Heading dropdown" },
      description:
        "Heading dropdown'ı içinde görünecek block tipleri (sadece `heading` feature aktifken etkili).",
      if: { arg: "showToolbar", truthy: true },
    },
    // ── Blocks ───────────────────────────
    enabledBlockKeys: {
      control: "check",
      options: ALL_BLOCK_KEYS,
      name: "Enabled blocks",
      table: { category: "Blocks" },
      description:
        "Registry'den seçilen block key'leri. Filtre üç yüzeye birden uygulanır: Insert dropdown, slash menu (`/`) ve draggable `+` menüsü. Bir block kapatılırsa hiçbir yüzeyde görünmez.",
    },
    // ── Initial content ──────────────────
    initialHtml: {
      control: "text",
      table: { category: "Initial content" },
      description:
        "Editör mount olurken parse edilen HTML. Markdown'a göre daha kapsamlı (renk, hizalama, table, sub/sup vs. destekler).",
    },
  },
};

export default meta;

function PlaygroundDemo(args: PlaygroundArgs) {
  const [value, setValue] = React.useState<RichTextValue>();
  const [tab, setTab] = React.useState<
    "html" | "markdown" | "json" | "text"
  >("html");

  // Single source of truth — the same filtered registry feeds all three
  // surfaces (Insert dropdown, slash menu, draggable + menu) so toggling
  // a block off in controls removes it everywhere.
  const enabledBlocks = React.useMemo(
    () =>
      defaultBlocks.filter((b) => args.enabledBlockKeys.includes(b.key)),
    [args.enabledBlockKeys],
  );

  const tabs: Array<{
    key: "html" | "markdown" | "json" | "text";
    label: string;
  }> = [
    { key: "html", label: "HTML" },
    { key: "markdown", label: "Markdown" },
    { key: "json", label: "JSON" },
    { key: "text", label: "Text" },
  ];

  const content =
    !value || value[tab] === undefined
      ? "—"
      : tab === "json"
        ? JSON.stringify(JSON.parse(value.json), null, 2)
        : value[tab];

  return (
    <div className="max-w-5xl space-y-4">
      <RichTextEditor
        editable={args.editable}
        autoFocus={args.autoFocus}
        initialHtml={args.initialHtml}
        maxLength={args.maxLength > 0 ? args.maxLength : undefined}
        charset={args.charset}
        onChange={args.showOutput ? setValue : undefined}
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
        {args.showPageSize && <RichTextPageSize />}
      </RichTextEditor>

      {args.showOutput && (
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
      )}
    </div>
  );
}

export const Playground: StoryObj<PlaygroundArgs> = {
  render: (args) => <PlaygroundDemo {...args} />,
};
