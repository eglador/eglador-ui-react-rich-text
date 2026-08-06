"use client";

import * as React from "react";
import {
  CalendarClockIcon,
  CaseSensitiveIcon,
  Columns3Icon,
  FrameIcon,
  Heading2Icon,
  ImageIcon,
  LinkIcon,
  MaximizeIcon,
  QuoteIcon,
  SplitViewIcon,
  VideoIcon,
} from "../../../lib/icons";
import {
  ImageQuotePreview,
  NewsMomentPreview,
  QuotePreview,
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

const EMBED_OPTIONS: CmsFieldOption[] = [
  { value: "audio", label: "Ses" },
  { value: "twitter", label: "Twitter / X" },
  { value: "soundcloud", label: "SoundCloud" },
  { value: "googlemap", label: "Google Harita" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
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
    type: "baslik",
    title: "Başlık",
    icon: icon(Heading2Icon),
    keywords: ["baslik", "başlık", "heading"],
    fields: [
      { name: "id", label: "ID", inputType: "text" },
      {
        name: "text",
        label: "Başlık metni",
        inputType: "text",
        optional: true,
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        options: POSITION_LEFT_RIGHT,
        optional: true,
      },
    ],
  },
  {
    type: "canliyayin",
    title: "Canlı Yayın",
    icon: icon(VideoIcon),
    keywords: ["canli", "canlı", "yayin", "live"],
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
    title: "Depo Mu Kaç Dolar",
    icon: icon(FrameIcon),
    keywords: ["depo", "dolar", "yakit", "yakıt"],
    fields: [{ name: "id", label: "ID", inputType: "text" }],
  },
  {
    type: "depremler",
    title: "Depremler Haritası",
    icon: icon(MaximizeIcon),
    keywords: ["deprem", "harita", "map"],
    fields: [
      {
        name: "view",
        label: "Görünüm",
        inputType: "text",
        placeholder: "harita",
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
    type: "havadurumu",
    title: "Hava Durumu",
    icon: icon(FrameIcon),
    keywords: ["hava", "durumu", "weather"],
    fields: [{ name: "id", label: "ID", inputType: "text" }],
  },
  {
    type: "kredihesaplama",
    title: "Kredi Hesaplama",
    icon: icon(FrameIcon),
    keywords: ["kredi", "hesaplama", "loan"],
    fields: [{ name: "id", label: "ID", inputType: "text" }],
  },
  {
    type: "kurcevirici",
    title: "Kur Çevirici",
    icon: icon(FrameIcon),
    keywords: ["kur", "cevirici", "çevirici", "currency"],
    fields: [{ name: "id", label: "ID", inputType: "text" }],
  },
  {
    // NOT `link`: `@lexical/link`'s LinkNode already owns that registry
    // key, and Lexical's node map is last-write-wins — registering a
    // second `link` node silently replaces LinkNode and breaks every
    // hyperlink in the document. The CMS-side keyword is still `link`;
    // map it in your serializer.
    type: "linkEmbed",
    title: "Bağlantı / Gömülü İçerik",
    icon: icon(LinkIcon),
    keywords: ["link", "embed", "gomulu", "gömülü", "baglanti", "bağlantı"],
    fields: [
      { name: "url", label: "URL", inputType: "url" },
      {
        name: "embed",
        label: "Gömülü içerik türü",
        inputType: "select",
        optional: true,
        options: EMBED_OPTIONS,
      },
      {
        name: "position",
        label: "Hizalama",
        inputType: "select",
        optional: true,
        options: POSITION_LEFT_RIGHT,
      },
    ],
  },
  {
    type: "mansethaberresim",
    title: "Manşet Haber Resmi",
    icon: icon(ImageIcon),
    keywords: ["manset", "manşet", "resim"],
    fields: [{ name: "id", label: "Resim ID", inputType: "text" }],
    renderPreview: SingleMediaPreview("id"),
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
    icon: icon(FrameIcon),
    keywords: ["piyasa", "borsa", "market"],
    fields: [{ name: "id", label: "ID", inputType: "text" }],
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
    keywords: ["sabit", "link"],
    fields: [{ name: "url", label: "URL", inputType: "url" }],
  },
  {
    type: "videooynat",
    title: "Video Oynat",
    icon: icon(VideoIcon),
    keywords: ["video", "oynat", "play"],
    fields: [{ name: "id", label: "Video ID", inputType: "text" }],
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
  {
    type: "newsMoment",
    title: "News Moment",
    description: "Tarih, saat, başlık, içerik ve görseller",
    icon: icon(CalendarClockIcon),
    keywords: ["news", "moment", "an", "haber", "canli", "canlı"],
    fields: [
      { name: "date", label: "Tarih", inputType: "date" },
      { name: "time", label: "Saat", inputType: "time" },
      { name: "title", label: "Başlık", inputType: "text" },
      { name: "content", label: "İçerik", inputType: "textarea" },
      {
        name: "images",
        label: "Resimler",
        inputType: "image-ids",
        placeholder: "345456, 345457",
        optional: true,
      },
    ],
    renderPreview: NewsMomentPreview,
  },
];
