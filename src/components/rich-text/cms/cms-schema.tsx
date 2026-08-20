"use client";

import * as React from "react";
import {
  CalendarClockIcon,
  CaseSensitiveIcon,
  Columns3Icon,
  FrameIcon,
  ImageIcon,
  InstagramIcon,
  LinkIcon,
  MapPinIcon,
  MaximizeIcon,
  QuoteIcon,
  SoundCloudIcon,
  SplitViewIcon,
  TwitterXIcon,
  VideoIcon,
} from "../../../lib/icons";
import {
  EmbedLinkPreview,
  FixedLinkPreview,
  ImageQuotePreview,
  QuotePreview,
  TitledQuotePreview,
  SingleMediaPreview,
  UrlImagePreview,
} from "./cms-previews";
import type { CmsBlockSpec, CmsFieldOption } from "./cms-types";

const ICON_SIZE = "size-4";
const icon = (Component: React.ComponentType<{ className?: string }>) => (
  <Component className={ICON_SIZE} />
);

const POSITION_LEFT_RIGHT: CmsFieldOption[] = [
  { value: "left", label: "Sol" },
  { value: "right", label: "Sağ" },
];

const POSITION_LEFT_CENTER_RIGHT: CmsFieldOption[] = [
  { value: "left", label: "Sol" },
  { value: "center", label: "Orta" },
  { value: "right", label: "Sağ" },
];

const CONTENT_TYPE_OPTIONS: CmsFieldOption[] = [
  { value: "haber", label: "Haber" },
  { value: "galeri", label: "Galeri" },
  { value: "video", label: "Video" },
];

/** Live-stream channels. The option *values* are the CMS channel IDs
 *  that end up in the serialized JSON. */
const CHANNEL_OPTIONS: CmsFieldOption[] = [
  { value: "300", label: "BHT TV" },
  { value: "100", label: "HT TV" },
  { value: "10", label: "SHOWTV" },
];

/** Market widgets. Values mirror the CMS `usd_eur` select. */
const MARKET_OPTIONS: CmsFieldOption[] = [
  { value: "88", label: "$ - Dolar" },
  { value: "89", label: "€ - Euro" },
  { value: "1", label: "BIST 100" },
];

const LINK_COLOR_OPTIONS: CmsFieldOption[] = [
  { value: "kirmizi", label: "Kırmızı" },
  { value: "mavi", label: "Mavi" },
  { value: "yesil", label: "Yeşil" },
];

/**
 * Eglador CMS block set. Each entry becomes a real Lexical
 * `DecoratorBlockNode` (see `cms-node-factory.tsx`) whose `type` is the
 * `type` field below — so a gallery serializes as
 * `{"type":"galeri","version":1,"format":"","id":"123"}`, exactly like
 * the built-in image/video blocks, not as a `#galeri#123#` text run.
 *
 * Types already covered by a built-in block are deliberately absent:
 * `resim` → the `image` block (ID mode), `video` → the `video` block
 * (ID mode), `imagecompare` → the `image-comparison` block.
 */
export const CMS_BLOCK_SCHEMA: CmsBlockSpec[] = [
  {
    type: "360resim",
    title: "360° Resim",
    icon: icon(ImageIcon),
    keywords: ["360", "panorama", "resim"],
    fields: [{ name: "url", label: "Görsel URL", inputType: "url" }],
    renderPreview: UrlImagePreview("url"),
  },
  {
    type: "canliyayin",
    title: "Canlı Yayın",
    icon: icon(VideoIcon),
    keywords: ["canli", "canlı", "yayin", "live", "tv", "kanal"],
    fields: [
      {
        name: "channel",
        label: "Kanal",
        inputType: "select",
        options: CHANNEL_OPTIONS,
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
      },
    ],
  },
  {
    type: "countdown",
    title: "Geri Sayım",
    icon: icon(CalendarClockIcon),
    keywords: ["countdown", "geri", "sayim", "sayım"],
    fields: [
      {
        name: "date",
        label: "Tarih (gg-aa-yyyy-ss-dd)",
        inputType: "text",
        placeholder: "22-12-2021-18-00",
      },
      { name: "label", label: "Etiket", inputType: "text" },
      { name: "url", label: "URL", inputType: "url" },
    ],
  },
  {
    type: "depomkacadolar",
    title: "Depom kaça dolar?",
    icon: icon(FrameIcon),
    keywords: ["depo", "dolar", "yakit", "yakıt"],
    fields: [
      {
        name: "widget",
        label: "Görünüm",
        inputType: "select",
        options: [{ value: "hesaplayici", label: "Hesaplayıcıyı ekle" }],
      },
    ],
  },
  {
    type: "depremler",
    title: "Depremler Haritası",
    icon: icon(MaximizeIcon),
    keywords: ["deprem", "harita", "map", "liste"],
    fields: [
      {
        name: "view",
        label: "Görünüm",
        inputType: "select",
        options: [
          { value: "harita", label: "Harita" },
          { value: "liste", label: "Liste" },
        ],
      },
    ],
  },
  {
    type: "dikeyciftli",
    title: "Dikey Çiftli İçerik",
    icon: icon(SplitViewIcon),
    keywords: ["dikey", "ciftli", "çiftli"],
    fields: [
      {
        name: "firstContentType",
        label: "Birinci içerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      {
        name: "firstContentId",
        label: "Birinci içerik ID",
        inputType: "text",
      },
      {
        name: "secondContentType",
        label: "İkinci içerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      {
        name: "secondContentId",
        label: "İkinci içerik ID",
        inputType: "text",
      },
    ],
  },
  {
    type: "dikeylink",
    title: "Dikey Link",
    icon: icon(LinkIcon),
    keywords: ["dikey", "link"],
    fields: [
      {
        name: "contentType",
        label: "İçerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      { name: "id", label: "İçerik ID", inputType: "text" },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
      },
    ],
  },
  {
    type: "flourish",
    title: "Flourish",
    icon: icon(FrameIcon),
    keywords: ["flourish", "grafik", "chart"],
    fields: [
      {
        name: "path",
        label: "Story ID / yol",
        inputType: "text",
        placeholder: "story/230114",
      },
    ],
  },
  {
    type: "galeri",
    title: "Galeri",
    icon: icon(ImageIcon),
    keywords: ["galeri", "gallery", "foto"],
    fields: [{ name: "id", label: "Galeri ID", inputType: "text" }],
    renderPreview: SingleMediaPreview("id"),
  },
  {
    type: "habericionecikanlar",
    title: "Haberin İçinde Öne Çıkanlar",
    icon: icon(QuoteIcon),
    keywords: ["one", "öne", "cikan", "çıkan", "haber"],
    fields: [
      { name: "id", label: "ID", inputType: "text" },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
      },
    ],
  },
  {
    type: "habericireklam",
    title: "Haber İçi Reklam",
    icon: icon(FrameIcon),
    keywords: ["reklam", "ad", "banner"],
    fields: [
      {
        name: "size",
        label: "Boyut",
        inputType: "text",
        placeholder: "300x250",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
      },
    ],
  },
  {
    type: "havadurumu",
    title: "Hava Durumu",
    icon: icon(FrameIcon),
    keywords: ["hava", "durumu", "weather"],
    fields: [
      {
        name: "widget",
        label: "Görünüm",
        inputType: "select",
        options: [{ value: "100", label: "Hava durumu ekle" }],
      },
    ],
  },
  {
    type: "kredihesaplama",
    title: "Kredi Hesaplama",
    icon: icon(FrameIcon),
    keywords: ["kredi", "hesaplama", "loan"],
    fields: [
      {
        name: "widget",
        label: "Görünüm",
        inputType: "select",
        options: [{ value: "hesaplayici", label: "Hesaplayıcıyı ekle" }],
      },
    ],
  },
  {
    type: "kurcevirici",
    title: "Kur Çevirici",
    icon: icon(FrameIcon),
    keywords: ["kur", "cevirici", "çevirici", "currency"],
    fields: [
      {
        name: "widget",
        label: "Görünüm",
        inputType: "select",
        options: [{ value: "cevirici", label: "Çeviriciyi ekle" }],
      },
    ],
  },
  {
    // NOT `link`: `@lexical/link`'s LinkNode already owns that registry
    // key, and Lexical's node map is last-write-wins — registering a
    // second `link` node silently replaces LinkNode and breaks every
    // hyperlink in the document. The CMS-side keyword is still `link`;
    // map it in your serializer.
    //
    // The platform-specific cases that used to live behind this block's
    // `embed` select are their own types now (see the social/media group
    // below), so this is the plain-link case only.
    type: "linkEmbed",
    title: "Bağlantı / Gömülü İçerik",
    icon: icon(LinkIcon),
    keywords: ["link", "embed", "gomulu", "gömülü", "baglanti", "bağlantı"],
    fields: [
      { name: "url", label: "URL", inputType: "url" },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: EmbedLinkPreview(
      "Bağlantı",
      "border-zinc-300 bg-zinc-50 text-zinc-700",
    ),
  },

  // ── social / media embeds ──────────────────────
  // Split out of `linkEmbed`'s old `embed` select so each platform has
  // its own node type in the JSON. YouTube and audio are covered by the
  // built-in `youtube` / `audio` blocks and deliberately absent here.
  {
    type: "twitter",
    title: "Twitter / X",
    icon: icon(TwitterXIcon),
    keywords: ["twitter", "x", "tweet", "gomulu", "gömülü"],
    fields: [
      {
        name: "url",
        label: "Tweet URL",
        inputType: "url",
        placeholder: "https://x.com/kullanici/status/123456",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: EmbedLinkPreview(
      "Twitter / X",
      "border-sky-300 bg-sky-50 text-sky-800",
    ),
  },
  {
    type: "instagram",
    title: "Instagram",
    icon: icon(InstagramIcon),
    keywords: ["instagram", "insta", "reels", "gomulu", "gömülü"],
    fields: [
      {
        name: "url",
        label: "Gönderi URL",
        inputType: "url",
        placeholder: "https://www.instagram.com/p/ABC123/",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: EmbedLinkPreview(
      "Instagram",
      "border-pink-300 bg-pink-50 text-pink-800",
    ),
  },
  {
    type: "soundcloud",
    title: "SoundCloud",
    icon: icon(SoundCloudIcon),
    keywords: ["soundcloud", "ses", "muzik", "müzik", "audio"],
    fields: [
      {
        name: "url",
        label: "Parça URL",
        inputType: "url",
        placeholder: "https://soundcloud.com/sanatci/parca",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: EmbedLinkPreview(
      "SoundCloud",
      "border-orange-300 bg-orange-50 text-orange-800",
    ),
  },
  {
    type: "googlemap",
    title: "Google Haritalar",
    icon: icon(MapPinIcon),
    keywords: ["google", "harita", "haritalar", "map", "maps", "konum"],
    fields: [
      {
        name: "url",
        label: "Harita URL",
        inputType: "url",
        placeholder: "https://www.google.com/maps/embed?pb=...",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: EmbedLinkPreview(
      "Google Haritalar",
      "border-emerald-300 bg-emerald-50 text-emerald-800",
    ),
  },
  {
    type: "mansethaberresim",
    title: "Manşet Haber Resmi",
    icon: icon(ImageIcon),
    keywords: ["manset", "manşet", "resim"],
    // Plain content ID, not a media ID — so no `resolveImageSrc`
    // preview here; it wouldn't resolve to anything.
    fields: [{ name: "id", label: "ID", inputType: "text" }],
  },
  {
    type: "ozelharf",
    title: "Özel Harf",
    icon: icon(CaseSensitiveIcon),
    keywords: ["ozel", "özel", "harf", "dropcap"],
    fields: [{ name: "letter", label: "Harf", inputType: "text" }],
  },
  {
    type: "piyasa",
    title: "Piyasa",
    description: "USD/TRY · EUR/TRY · BIST 100",
    icon: icon(FrameIcon),
    keywords: ["piyasa", "borsa", "market", "dolar", "euro", "bist"],
    fields: [
      {
        // Field name matches the CMS form control (`name="usd_eur"`);
        // the option values are the market IDs themselves.
        name: "usd_eur",
        label: "Piyasa verisi",
        inputType: "select",
        options: MARKET_OPTIONS,
      },
    ],
  },
  {
    type: "quato1",
    title: "Kota / Alıntı",
    icon: icon(QuoteIcon),
    keywords: ["kota", "alinti", "alıntı", "quote"],
    fields: [
      {
        name: "text",
        label: "Alıntı metni",
        inputType: "textarea",
        placeholder: "Alıntılanacak metin",
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
      },
    ],
    renderPreview: QuotePreview,
  },
  {
    // Sibling of `quato1`: a titled variant where the quote carries a
    // heading plus an explanatory body instead of a single run of text.
    type: "quato2",
    title: "Başlıklı Alıntı",
    description: "Başlık + açıklama",
    icon: icon(QuoteIcon),
    keywords: ["kota", "alinti", "alıntı", "quote", "baslik", "başlık"],
    fields: [
      {
        name: "title",
        label: "Başlık",
        inputType: "text",
        placeholder: "Alıntı başlığı",
      },
      {
        name: "description",
        label: "Açıklama",
        inputType: "textarea",
        placeholder: "Açıklama metni",
      },
    ],
    renderPreview: TitledQuotePreview,
  },
  {
    type: "resimliquato",
    title: "Resimli Kota",
    icon: icon(QuoteIcon),
    keywords: ["resimli", "kota", "quote"],
    fields: [
      { name: "url", label: "Görsel URL", inputType: "url" },
      {
        name: "text",
        label: "Alıntı metni",
        inputType: "textarea",
        placeholder: "Alıntılanacak metin",
      },
    ],
    renderPreview: ImageQuotePreview,
  },
  {
    type: "sabitlink",
    title: "Sabit Link",
    icon: icon(LinkIcon),
    keywords: ["sabit", "link", "renk"],
    fields: [
      {
        name: "color",
        label: "Renk",
        inputType: "select",
        options: LINK_COLOR_OPTIONS,
      },
      { name: "url", label: "Bağlantı", inputType: "url" },
      { name: "text", label: "Metin", inputType: "text" },
    ],
    renderPreview: FixedLinkPreview,
  },
  {
    type: "yatayciftli",
    title: "Yatay Çiftli İçerik",
    icon: icon(Columns3Icon),
    keywords: ["yatay", "ciftli", "çiftli"],
    fields: [
      {
        name: "firstContentType",
        label: "Birinci içerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      {
        name: "firstContentId",
        label: "Birinci içerik ID",
        inputType: "text",
      },
      {
        name: "secondContentType",
        label: "İkinci içerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      {
        name: "secondContentId",
        label: "İkinci içerik ID",
        inputType: "text",
      },
    ],
  },
  {
    type: "yataytekli",
    title: "Yatay Tekli İçerik",
    icon: icon(Columns3Icon),
    keywords: ["yatay", "tekli"],
    fields: [
      {
        name: "contentType",
        label: "İçerik türü",
        inputType: "select",
        options: CONTENT_TYPE_OPTIONS,
      },
      { name: "id", label: "İçerik ID", inputType: "text" },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_CENTER_RIGHT,
      },
    ],
  },
];
