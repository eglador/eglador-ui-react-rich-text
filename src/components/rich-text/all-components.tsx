"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  SKIP_DOM_SELECTION_TAG,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createTableNodeWithDimensions } from "@lexical/table";
import { $createColumnNode, $createColumnsNode } from "./columns-node";
import { $createImageNode } from "./image-node";
import { $createVideoNode } from "./video-node";
import { $createYouTubeNode } from "./youtube-node";
import { $createAudioNode } from "./audio-node";
import { $createIframeNode } from "./iframe-node";
import { $createImageComparisonNode } from "./image-comparison-node";
import { $createCmsNode, CMS_BLOCK_SCHEMA } from "./cms";
import type { CmsBlockSpec, CmsFieldSpec } from "./cms";

/**
 * Placeholder media the generated document points at. Override any of
 * these so the demo document renders against your own CDN / media IDs
 * instead of the public samples.
 */
export interface AllComponentsSample {
  /** URL for the URL-addressed image block. */
  imageUrl: string;
  /** ID for the ID-addressed image block (resolved via `resolveImageSrc`). */
  imageId: string;
  /** ID for the ID-addressed video block. */
  videoId: string;
  /** 11-character YouTube video ID. */
  youtubeId: string;
  audioUrl: string;
  iframeUrl: string;
  compareBeforeUrl: string;
  compareAfterUrl: string;
  /** Media IDs used for `image-ids` fields (e.g. `newsMoment.images`). */
  mediaIds: string[];
  /** URL used by CMS types that preview a direct image URL. */
  cmsImageUrl: string;
  /** URL used by CMS types whose URL is a plain link, not an image. */
  cmsLinkUrl: string;
}

export const ALL_COMPONENTS_DEFAULT_SAMPLE: AllComponentsSample = {
  imageUrl: "https://picsum.photos/id/1015/1200/675",
  imageId: "345457",
  videoId: "913597",
  youtubeId: "jNQXAC9IVRw",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  iframeUrl:
    "https://www.openstreetmap.org/export/embed.html?bbox=28.85%2C40.98%2C29.15%2C41.12&layer=mapnik",
  compareBeforeUrl: "https://picsum.photos/id/1016/1200/675",
  compareAfterUrl: "https://picsum.photos/id/1024/1200/675",
  mediaIds: ["345456", "345457", "345458"],
  cmsImageUrl: "https://picsum.photos/id/1025/1200/675",
  cmsLinkUrl: "https://www.eglador.com/haber/345456",
};

export interface AllComponentsOptions {
  /**
   * `"replace"` (default) empties the document first; `"append"` keeps
   * what's there and adds the blocks at the end.
   */
  mode?: "replace" | "append";
  /** Include the `h1`/`h2` section headings and explanatory paragraphs. */
  includeHeadings?: boolean;
  /** Include the built-in blocks (text, table, columns, media). */
  includeBuiltIns?: boolean;
  /**
   * Restrict the CMS section to these types (defaults to every type in
   * `CMS_BLOCK_SCHEMA`). Pass `[]` to skip CMS blocks entirely.
   */
  cmsTypes?: string[];
  /** Placeholder media overrides — see {@link AllComponentsSample}. */
  sample?: Partial<AllComponentsSample>;
}

// ─── sample field values ────────────────────────────────────────

const SAMPLE_BY_FIELD_NAME: Record<string, string> = {
  letter: "A",
  text: "Örnek başlık metni",
  title: "Canlı gelişme başlığı",
  label: "Yılbaşına kalan süre",
  content:
    "Örnek içerik metni. Bu alan çok satırlı girilebilir ve kartta ilk üç satırı önizlenir.",
};

/** Several types share the field name `text`; these read better with a
 *  type-specific sample than with the field's generic placeholder. */
const SAMPLE_BY_TYPE_AND_FIELD: Record<string, Record<string, string>> = {
  quato1: {
    text: "En iyi araç yolunuzdan çekilen, düşünceyi engellemeyen araçtır.",
  },
  resimliquato: {
    text: "Tasarım sadece nasıl göründüğü değil, nasıl çalıştığıdır.",
  },
};

function sampleFieldValue(
  spec: CmsBlockSpec,
  field: CmsFieldSpec,
  sample: AllComponentsSample,
): string {
  const perType = SAMPLE_BY_TYPE_AND_FIELD[spec.type]?.[field.name];
  if (perType) return perType;

  switch (field.inputType) {
    case "select":
      return field.options?.[0]?.value ?? "";
    case "date":
      return new Date().toISOString().slice(0, 10);
    case "time":
      return "18:00";
    case "image-ids":
      return sample.mediaIds.join(", ");
    case "url":
      // Types that preview their URL as an image need a real image.
      return spec.renderPreview ? sample.cmsImageUrl : sample.cmsLinkUrl;
    case "number":
      return "26";
    default:
      return (
        SAMPLE_BY_FIELD_NAME[field.name] ??
        field.placeholder ??
        (/id\d*$/i.test(field.name) ? sample.mediaIds[0] : "Örnek değer")
      );
  }
}

function sampleFields(
  spec: CmsBlockSpec,
  sample: AllComponentsSample,
): Record<string, string> {
  return Object.fromEntries(
    spec.fields.map((field) => [field.name, sampleFieldValue(spec, field, sample)]),
  );
}

// ─── node builders ──────────────────────────────────────────────

const $heading = (tag: "h1" | "h2" | "h3", text: string) => {
  const node = $createHeadingNode(tag);
  node.append($createTextNode(text));
  return node;
};

const $para = (text?: string) => {
  const node = $createParagraphNode();
  if (text) node.append($createTextNode(text));
  return node;
};

const $list = (type: "bullet" | "number", items: string[]) => {
  const list = $createListNode(type);
  for (const text of items) {
    const item = $createListItemNode();
    item.append($createTextNode(text));
    list.append(item);
  }
  return list;
};

const $quote = (text: string) => {
  const node = $createQuoteNode();
  node.append($createTextNode(text));
  return node;
};

/**
 * Build one node per component this editor ships — text blocks, table,
 * columns, every media embed, and every CMS block — as a flat array in
 * document order.
 *
 * Must be called inside `editor.update()` / `editor.read()` (it uses
 * Lexical `$` factories). Prefer {@link insertAllComponents} unless you
 * need the nodes without inserting them.
 */
export function $buildAllComponentNodes(
  options: AllComponentsOptions = {},
): LexicalNode[] {
  const {
    includeHeadings = true,
    includeBuiltIns = true,
    cmsTypes,
    sample: sampleOverrides,
  } = options;
  const sample = { ...ALL_COMPONENTS_DEFAULT_SAMPLE, ...sampleOverrides };

  const nodes: LexicalNode[] = [];
  const section = (text: string) => {
    if (includeHeadings) nodes.push($heading("h2", text));
  };

  if (includeHeadings) {
    nodes.push(
      $heading("h1", "Tüm bileşenler"),
      $para(
        "Bu belge, editörün sunduğu her bileşenin eklenmiş halini içerir. " +
          "Bir bloğun üzerine gelip sağ üstteki dişliye tıklayarak ayarlarını " +
          "açabilir, soldaki tutamaçtan sürükleyerek yerini değiştirebilirsin.",
      ),
    );
  }

  if (includeBuiltIns) {
    section("Metin blokları");
    nodes.push(
      $heading("h3", "Alt başlık"),
      $para(
        "Düz paragraf. Markdown kısayolları (**kalın**, _italik_, # başlık) ve " +
          "klavye kısayolları (Cmd/Ctrl+B, Cmd/Ctrl+I) burada da çalışır.",
      ),
      $list("bullet", ["Madde bir", "Madde iki", "Madde üç"]),
      $list("number", ["Birinci adım", "İkinci adım", "Üçüncü adım"]),
      $quote("Alıntı bloğu — kaynak gösterimi ve vurgulu pasajlar için."),
    );

    section("Tablo ve düzen");
    nodes.push(
      $createTableNodeWithDimensions(3, 3, { rows: false, columns: true }),
      $para(),
    );

    const columns = $createColumnsNode({ count: 2, gap: "medium" });
    for (const text of ["Sol sütun içeriği.", "Sağ sütun içeriği."]) {
      const column = $createColumnNode();
      column.append($para(text));
      columns.append(column);
    }
    nodes.push(columns, $para());

    section("Medya");
    nodes.push(
      $para("Resim — URL ile (src belgeye kaydedilir):"),
      $createImageNode(sample.imageUrl, {
        alt: "URL ile eklenmiş örnek görsel",
        caption: "URL modunda eklenen resim",
      }),
      $para("Resim — ID ile (src belgeye kaydedilmez, callback ile çözülür):"),
      $createImageNode("", {
        imageId: sample.imageId,
        alt: "ID ile eklenmiş örnek görsel",
        caption: "ID modunda eklenen resim — JSON’da yalnızca imageId var",
      }),
      $para("Video — ID ile:"),
      $createVideoNode("", { videoId: sample.videoId, title: "Örnek video" }),
      $para("YouTube:"),
      $createYouTubeNode(sample.youtubeId),
      $para("Ses dosyası:"),
      $createAudioNode(sample.audioUrl, { title: "Örnek ses kaydı" }),
      $para("Iframe (genel gömme):"),
      $createIframeNode(sample.iframeUrl, {
        title: "Harita gömmesi",
        aspectRatio: "16:9",
      }),
      $para("Görsel karşılaştırma (önce / sonra):"),
      $createImageComparisonNode(
        sample.compareBeforeUrl,
        sample.compareAfterUrl,
        { beforeLabel: "Önce", afterLabel: "Sonra" },
      ),
      $para(),
    );
  }

  const specs = cmsTypes
    ? CMS_BLOCK_SCHEMA.filter((spec) => cmsTypes.includes(spec.type))
    : CMS_BLOCK_SCHEMA;

  if (specs.length > 0) {
    section("CMS bileşenleri");
    for (const spec of specs) {
      const node = $createCmsNode(spec.type, sampleFields(spec, sample));
      if (node) nodes.push(node);
    }
  }

  // Trailing paragraph so there is always somewhere to type.
  nodes.push($para());
  return nodes;
}

/**
 * Insert every component into the document.
 *
 * ```ts
 * insertAllComponents(editor);                      // clear, then insert
 * insertAllComponents(editor, { mode: "append" });  // keep content, add at end
 * ```
 *
 * @returns how many top-level blocks were inserted.
 */
export function insertAllComponents(
  editor: LexicalEditor,
  options: AllComponentsOptions = {},
): number {
  let inserted = 0;
  editor.update(
    () => {
      const root = $getRoot();
      if ((options.mode ?? "replace") === "replace") root.clear();
      const nodes = $buildAllComponentNodes(options);
      inserted = nodes.length;
      root.append(...nodes);
    },
    // Don't drag the native selection (and the page scroll) into the
    // editor as a side effect of filling it.
    { tag: SKIP_DOM_SELECTION_TAG },
  );
  return inserted;
}

// ─── console escape hatch ───────────────────────────────────────

/** Shape of the function `RichTextDevGlobals` puts on `window`. */
export type AllComponentsGlobal = (
  arg?: "replace" | "append" | AllComponentsOptions,
) => { inserted: number; mode: "replace" | "append" };

export interface RichTextDevGlobalsProps {
  /** Global name to register (default `"lexicalComponentAllSet"`). */
  name?: string;
}

/**
 * Registers a console helper that fills the editor with every
 * component — handy for eyeballing a integration without building any
 * UI for it. Drop it inside `<RichTextEditor>`:
 *
 * ```tsx
 * {process.env.NODE_ENV !== "production" && <RichTextDevGlobals />}
 * ```
 *
 * Then, from the browser console:
 *
 * ```js
 * lexicalComponentAllSet()                       // clear, then insert all
 * lexicalComponentAllSet("append")               // keep content, add at end
 * lexicalComponentAllSet({ mode: "append", cmsTypes: ["galeri", "newsMoment"] })
 * ```
 *
 * The global is removed on unmount. With several editors on one page,
 * give each a distinct `name`.
 */
export function RichTextDevGlobals({
  name = "lexicalComponentAllSet",
}: RichTextDevGlobalsProps = {}): null {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const run: AllComponentsGlobal = (arg) => {
      const options: AllComponentsOptions =
        typeof arg === "string" ? { mode: arg } : (arg ?? {});
      const mode = options.mode ?? "replace";
      const inserted = insertAllComponents(editor, options);
      return { inserted, mode };
    };

    const scope = window as unknown as Record<string, unknown>;
    const previous = scope[name];
    scope[name] = run;

    return () => {
      // Only clean up our own function — a second editor may have
      // registered over it in the meantime.
      if (scope[name] === run) {
        if (previous === undefined) delete scope[name];
        else scope[name] = previous;
      }
    };
  }, [editor, name]);

  return null;
}

RichTextDevGlobals.displayName = "RichTextDevGlobals";
