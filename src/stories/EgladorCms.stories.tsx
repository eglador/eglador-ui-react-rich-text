import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextSlashCommands,
  RichTextOutput,
  RichTextStats,
  RichTextPageSize,
  RichTextDevGlobals,
  useRichTextEditor,
  defaultBlocks,
  getBlocksForSurface,
  type MediaResolver,
} from "../components/rich-text";

/**
 * Blocks hidden in this example. The same array feeds every surface, so
 * turning one off removes it from the toolbar "+" menu, the "/" menu and
 * the drag-handle menu at once.
 */
const HIDDEN_BLOCK_KEYS = [
  "check-list",
  "horizontal-rule",
  "page-break",
  "date-time",
  "code-block",
];

const CMS_BLOCKS = defaultBlocks.filter(
  (block) => !HIDDEN_BLOCK_KEYS.includes(block.key),
);

/** Stand-in for the host app's media service. In a real integration this
 *  would hit your CMS API and return the CDN URL for the given ID. */
const MEDIA_LIBRARY: Record<string, string> = {
  "345456": "https://picsum.photos/id/1015/1200/675",
  "345457": "https://picsum.photos/id/1016/1200/675",
  "345458": "https://picsum.photos/id/1024/1200/675",
  "345459": "https://picsum.photos/id/1033/1200/675",
  "913597": "https://picsum.photos/id/1043/1200/675",
};

/** Async on purpose — exercises the loading state and the stale-response
 *  guard in `useResolvedSrc`. */
/** The page's image library. Only `id` is required — a missing `url` is
 *  resolved through `resolveImageSrc`, so a bare ID list works too. */
const IMAGE_LIBRARY = Object.keys(MEDIA_LIBRARY).map((id) => ({
  id,
  title: `Görsel ${id}`,
}));

const resolveImageSrc: MediaResolver = (id) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(MEDIA_LIBRARY[id] ?? null), 300),
  );

const meta: Meta = {
  title: "Rich Text/Eglador CMS",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Eglador CMS integration. Every CMS type is a real Lexical `DecoratorBlockNode` — it previews live in the editor and serializes to its own Lexical JSON (`{\"type\":\"galeri\",\"version\":1,...}`), not to a `#galeri#123#` text run. The toolbar Insert menu and the `/` menu are driven by one shared block array, so both show the exact same list and behave identically.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const MatchedMenus: Story = {
  name: "Insert menüsü = Slash menüsü",
  parameters: {
    docs: {
      description: {
        story:
          "Open the toolbar **+** menu, then type **/** in the content — both lists are identical, in the same order, with the same behaviour (a block with a form opens that form on either surface). `check-list`, `horizontal-rule`, `page-break`, `date-time` and `code-block` are filtered out of both.\n\nTry a `galeri` or `newsMoment` block, then watch the JSON tab below: each block serializes under its own `type`.",
      },
      source: {
        code: `import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextSlashCommands,
  defaultBlocks,
} from "eglador-ui-react-rich-text";

const HIDDEN = ["check-list", "horizontal-rule", "page-break", "date-time", "code-block"];
const blocks = defaultBlocks.filter((b) => !HIDDEN.includes(b.key));

// Resolve a CMS media ID into a URL — the editor never stores the URL.
const resolveImageSrc = async (id: string) => {
  const res = await fetch(\`/api/media/\${id}\`);
  return res.ok ? (await res.json()).url : null;
};

export function MyEditor() {
  return (
    <RichTextEditor resolveImageSrc={resolveImageSrc} imageLibrary={IMAGE_LIBRARY}>
      {/* one array, three surfaces — the lists can't drift apart */}
      <RichTextToolbar insertBlocks={blocks} />
      <RichTextContent draggable floatingToolbar draggableBlocks={blocks} />
      <RichTextSlashCommands blocks={blocks} />
    </RichTextEditor>
  );
}`,
      },
    },
  },
  render: () => (
    <div className="max-w-5xl">
      <RichTextEditor resolveImageSrc={resolveImageSrc} imageLibrary={IMAGE_LIBRARY}>
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <RichTextContent
          draggable
          floatingToolbar
          draggableBlocks={CMS_BLOCKS}
          minHeight="min-h-64"
          placeholder="Bir bileşen eklemek için “/” yaz ya da yukarıdaki + düğmesini kullan..."
        />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <RichTextStats />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
    </div>
  ),
};

/** Demonstrates `hiddenFields`: the image block loses its caption and
 *  max-width — from the form *and* from the payload. */
const HIDDEN_FIELDS = { image: ["caption", "maxWidth"] };

export const ImageById: Story = {
  name: "Resim — ID ile (src JSON’a yazılmaz)",
  parameters: {
    docs: {
      description: {
        story:
          "Insert an **Image** block and fill only **Resim ID** (try `345456`, `345457`, `345458`). The preview is resolved through `resolveImageSrc`, and the JSON tab shows `options.imageId` with **no `src` key** — the URL belongs to the media service, the document only stores the ID. Leaving the ID blank and pasting a URL keeps the original URL behaviour. The `Video` block works the same way via **Video ID** (`913597`).",
      },
      source: {
        code: `const MEDIA = { "345456": "https://cdn.example.com/a.jpg" };

<RichTextEditor resolveImageSrc={(id) => MEDIA[id] ?? null}>
  <RichTextToolbar />
  <RichTextContent />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div className="max-w-3xl">
      <div className="mb-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
        Denenebilir ID’ler:{" "}
        {Object.keys(MEDIA_LIBRARY).map((id) => (
          <code key={id} className="mx-1 font-mono text-zinc-800">
            {id}
          </code>
        ))}
      </div>
      <RichTextEditor
        resolveImageSrc={resolveImageSrc}
        imageLibrary={IMAGE_LIBRARY}
        hiddenFields={HIDDEN_FIELDS}
      >
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <RichTextContent
          placeholder="+ → Image → sadece “Resim ID” alanını doldur"
          minHeight="min-h-40"
        />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
    </div>
  ),
};

export const NewsMoment: Story = {
  name: "News Moment",
  parameters: {
    docs: {
      description: {
        story:
          "`newsMoment` carries a date, a time, a title, body content and a comma-separated list of image IDs. The IDs render as thumbnails both in the form (so you can confirm each one resolves before saving) and in the block preview — all through the same `resolveImageSrc` callback.",
      },
    },
  },
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor resolveImageSrc={resolveImageSrc} imageLibrary={IMAGE_LIBRARY}>
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <RichTextContent
          placeholder="“/newsmoment” yaz — resimler alanına 345456, 345457 gir"
          minHeight="min-h-40"
        />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
    </div>
  ),
};

function BlockListComparison() {
  const insertList = React.useMemo(
    () => getBlocksForSurface("insert", CMS_BLOCKS),
    [],
  );
  const slashList = React.useMemo(
    () => getBlocksForSurface("slash", CMS_BLOCKS),
    [],
  );

  const identical =
    insertList.length === slashList.length &&
    insertList.every((block, i) => block.key === slashList[i].key);

  return (
    <div className="max-w-3xl space-y-3">
      <div
        className={
          identical
            ? "rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            : "rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        }
      >
        {identical
          ? `✓ Her iki menü de aynı ${insertList.length} bloğu aynı sırada gösteriyor.`
          : `✗ Listeler ayrıştı — Insert ${insertList.length}, slash ${slashList.length}.`}
      </div>

      <ol className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-3">
        {insertList.map((block, i) => (
          <li key={block.key} className="flex items-center gap-2 text-zinc-700">
            <span className="w-5 shrink-0 text-right font-mono text-zinc-400">
              {i + 1}
            </span>
            <span className="text-zinc-500">{block.icon}</span>
            <span className="truncate">{block.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const BlockList: Story = {
  name: "Blok listesi (doğrulama)",
  parameters: {
    docs: {
      description: {
        story:
          "Renders the resolved block list for both surfaces and asserts they match — a quick regression check that a future block can't land on one menu without the other.",
      },
    },
  },
  render: () => <BlockListComparison />,
};

// ─── Every component, pre-inserted ───────────────────────────────

/** Seeds the document once on mount using the library's own helper —
 *  the same call an integrating app makes. */
function SeedShowcase(): null {
  const { insertAllComponents } = useRichTextEditor();
  const seeded = React.useRef(false);

  React.useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    insertAllComponents();
  }, [insertAllComponents]);

  return null;
}

/** Buttons for the two modes, plus the console escape hatch. */
function ShowcaseControls() {
  const { insertAllComponents, clear } = useRichTextEditor();
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5">
      <button
        type="button"
        onClick={() => insertAllComponents()}
        className="cursor-pointer rounded border border-zinc-200 bg-white px-3 py-1 text-sm hover:border-zinc-400"
      >
        Temizle + tümünü bas
      </button>
      <button
        type="button"
        onClick={() => insertAllComponents({ mode: "append" })}
        className="cursor-pointer rounded border border-zinc-200 bg-white px-3 py-1 text-sm hover:border-zinc-400"
      >
        Sona ekle
      </button>
      <button
        type="button"
        onClick={clear}
        className="cursor-pointer rounded border border-zinc-200 bg-white px-3 py-1 text-sm hover:border-zinc-400"
      >
        Temizle
      </button>
      <code className="ml-auto text-[11px] text-zinc-500">
        konsol: lexicalComponentAllSet()
      </code>
    </div>
  );
}

export const AllComponents: Story = {
  name: "Tüm bileşenler (editöre ekli)",
  parameters: {
    docs: {
      description: {
        story:
          "Every component this editor ships, already placed in the document: text blocks, table, columns layout, all media embeds (image by URL **and** by ID, video by ID, YouTube, audio, iframe, before/after comparison) and all Eglador CMS blocks.\n\nThe content comes from `insertAllComponents()` — the same helper an integrating app calls — so it stays in sync with `CMS_BLOCK_SCHEMA` automatically. Use the buttons for the two modes (`replace` / `append`), or open the browser console and run `lexicalComponentAllSet()`, which `<RichTextDevGlobals />` registers.\n\nThe JSON tab shows the whole document's Lexical serialization: every CMS block under its own `type`, and the ID-addressed image/video carrying no `src`.",
      },
      source: {
        code: `import {
  RichTextEditor, RichTextContent, RichTextToolbar,
  RichTextDevGlobals, useRichTextEditor,
} from "eglador-ui-react-rich-text";

function FillButton() {
  const { insertAllComponents } = useRichTextEditor();
  return (
    <>
      <button onClick={() => insertAllComponents()}>Temizle + tümünü bas</button>
      <button onClick={() => insertAllComponents({ mode: "append" })}>Sona ekle</button>
    </>
  );
}

<RichTextEditor resolveImageSrc={resolveImageSrc} imageLibrary={IMAGE_LIBRARY}>
  <RichTextToolbar />
  <FillButton />
  <RichTextContent draggable floatingToolbar />
  {/* console: lexicalComponentAllSet() / lexicalComponentAllSet("append") */}
  <RichTextDevGlobals />
</RichTextEditor>`,
      },
    },
  },
  render: () => (
    <div className="max-w-5xl">
      <RichTextEditor resolveImageSrc={resolveImageSrc} imageLibrary={IMAGE_LIBRARY}>
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <ShowcaseControls />
        <RichTextContent
          draggable
          floatingToolbar
          draggableBlocks={CMS_BLOCKS}
          minHeight="min-h-64"
        />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <SeedShowcase />
        <RichTextDevGlobals />
        <RichTextStats showReadingTime />
        <RichTextPageSize />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
    </div>
  ),
};


// ── host-supplied dropdown choices + pasted embed codes ────────────────

/** Stand-in for the host CMS: the live channels a site actually has. */
const CHANNELS = [
  { value: "300", label: "BHT TV" },
  { value: "55", label: "Eglador TV" },
  { value: "77", label: "Haber 77" },
];

/** Async on purpose — exercises the loading state and the cache. */
const loadMarkets = () =>
  new Promise<{ value: string; label: string }[]>((resolve) =>
    setTimeout(
      () =>
        resolve([
          { value: "88", label: "$ - Dolar" },
          { value: "500", label: "₿ - Bitcoin" },
          { value: "501", label: "Gram Altın" },
        ]),
      600,
    ),
  );

/** A saved block whose channel (999) is not in the host's list — the
 *  edit form must keep it rather than silently switching channels. */
const STALE_CHANNEL_JSON = JSON.stringify({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      {
        type: "canliyayin",
        version: 1,
        format: "",
        channel: "999",
        position: "left",
      },
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [],
      },
    ],
  },
});

export const HostSuppliedOptions: Story = {
  name: "Dışarıdan seçenek listesi (cmsFieldOptions)",
  parameters: {
    docs: {
      description: {
        story:
          "Canlı yayın kanalları, piyasa widget'ları gibi select listeleri `cmsFieldOptions` ile dışarıdan verilir. Değer bir dizi ya da (async) fonksiyon olabilir. Kayıtlı bir değer listede yoksa silinmez, kendi seçeneği olarak korunur.",
      },
    },
  },
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor
        initialJson={STALE_CHANNEL_JSON}
        cmsFieldOptions={{
          canliyayin: { channel: CHANNELS },
          piyasa: { usd_eur: loadMarkets },
          "*": {
            position: [
              { value: "left", label: "Sola yaslı" },
              { value: "right", label: "Sağa yaslı" },
            ],
          },
        }}
      >
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <RichTextContent minHeight="min-h-40" />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
      <p className="mt-2 text-xs text-zinc-500">
        “+” → Canlı Yayın: kanallar yukarıdaki listeden gelir. Piyasa: seçenekler
        yüklenene kadar select bekler. Mevcut bloğun dişlisi: kanal 999 “listede
        yok” olarak korunur.
      </p>
    </div>
  ),
};

export const PastedEmbedCode: Story = {
  name: "Iframe kodu yapıştırma (Google Haritalar)",
  parameters: {
    docs: {
      description: {
        story:
          "Google Haritalar'ın Paylaş kutusundan kopyalanan `<iframe …>` kodu URL alanına yapıştırıldığında sadece `src` alınır; `&amp;` gibi kaçışlar çözülür. Aynı davranış YouTube ve iframe bloklarının URL alanlarında da geçerli.",
      },
    },
  },
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor>
        <RichTextToolbar insertBlocks={CMS_BLOCKS} />
        <RichTextContent minHeight="min-h-40" />
        <RichTextSlashCommands blocks={CMS_BLOCKS} />
        <RichTextOutput defaultTab="json" />
      </RichTextEditor>
      <p className="mt-2 text-xs text-zinc-500">
        “+” → Google Haritalar → Harita URL alanına iframe kodunu yapıştır.
      </p>
    </div>
  ),
};

// ── caret access around edge blocks ───────────────────────────────────

const block = (type: string, extra: Record<string, unknown> = {}) => ({
  type,
  version: 1,
  format: "",
  ...extra,
});

/** Opens and closes with blocks the caret cannot be typed around. */
const EDGE_TRAP_JSON = JSON.stringify({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: "ltr",
    children: [
      block("galeri", { id: "345456", position: "left" }),
      {
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            text: "İki bloğun arasındaki tek paragraf.",
            format: 0,
            style: "",
            detail: 0,
            mode: "normal",
            version: 1,
          },
        ],
      },
      block("canliyayin", { channel: "300", position: "left" }),
    ],
  },
});

export const CaretEdges: Story = {
  name: "Kenardaki blokların üstü/altı (blockEdges)",
  parameters: {
    docs: {
      description: {
        story:
          "Belgenin başında veya sonunda duran resim/CMS bloğu, tablo ya da sütun bloğunun yanına imleç konamaz — `blockEdges` bu uçlara boş bir paragraf bırakır. Soldaki editörde açık (varsayılan), sağdakinde kapalı: sağda ilk bloğun üstüne tıklayıp yazamazsın.",
      },
    },
  },
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="mb-1 text-xs font-medium text-emerald-700">
          blockEdges (varsayılan: açık)
        </p>
        <RichTextEditor initialJson={EDGE_TRAP_JSON} resolveImageSrc={resolveImageSrc}>
          <RichTextToolbar insertBlocks={CMS_BLOCKS} />
          <RichTextContent minHeight="min-h-40" />
          <RichTextOutput defaultTab="json" />
        </RichTextEditor>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">
          blockEdges={"{false}"} — belge hiç değiştirilmez
        </p>
        <RichTextEditor
          initialJson={EDGE_TRAP_JSON}
          resolveImageSrc={resolveImageSrc}
          blockEdges={false}
        >
          <RichTextToolbar insertBlocks={CMS_BLOCKS} />
          <RichTextContent minHeight="min-h-40" />
          <RichTextOutput defaultTab="json" />
        </RichTextEditor>
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">
          sıradan belge — hiç paragraf eklenmez
        </p>
        <RichTextEditor initialHtml="<h2>Başlık</h2><p>Sadece metin.</p>">
          <RichTextToolbar insertBlocks={CMS_BLOCKS} />
          <RichTextContent minHeight="min-h-40" />
          <RichTextOutput defaultTab="json" />
        </RichTextEditor>
      </div>
    </div>
  ),
};
