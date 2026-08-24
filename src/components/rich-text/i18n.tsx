"use client";

import * as React from "react";

/**
 * Every user-facing string the editor chrome renders. Field labels that
 * belong to a consumer-supplied schema (`CmsBlockSpec.fields`) are not
 * here — those travel with the schema.
 */
export interface RichTextMessages {
  // ── shared form actions ──────────────────────
  cancel: string;
  save: string;
  insert: string;
  embed: string;
  delete: string;
  add: string;
  update: string;
  removeLink: string;

  // ── block picker ─────────────────────────────
  searchBlocks: string;
  noBlocksFound: string;
  insertBlock: string;

  // ── media forms ──────────────────────────────
  url: string;
  urlRequired: string;
  altText: string;
  altTextHint: string;
  caption: string;
  captionHint: string;
  maxWidth: string;
  auto: string;
  fixed: string;
  responsive: string;
  title: string;
  poster: string;
  aspectRatio: string;
  playerOptions: string;
  autoplay: string;
  mute: string;
  loop: string;
  showControls: string;
  preload: string;
  startAt: string;
  seconds: string;
  requiredByAutoplay: string;
  optional: string;

  // ── image by ID ──────────────────────────────
  imageId: string;
  videoId: string;
  resolvedUrl: string;
  resolving: string;
  notFoundForId: string;
  idOrUrlRequired: string;
  urlNotStoredHint: string;
  urlDisabledHint: string;
  /** Header of the image form, e.g. "Resim ekle" / "Resim". */
  insertImage: string;
  imageBlock: string;
  chooseImage: string;
  noImagesAvailable: string;
  loadingImages: string;
  clearSelection: string;
}

export const trMessages: RichTextMessages = {
  cancel: "Vazgeç",
  save: "Kaydet",
  insert: "Ekle",
  embed: "Ekle",
  delete: "Sil",
  add: "Ekle",
  update: "Güncelle",
  removeLink: "Bağlantıyı kaldır",

  searchBlocks: "Bileşen ara…",
  noBlocksFound: "Eşleşen bileşen yok",
  insertBlock: "Bileşen ekle",

  url: "URL",
  urlRequired: "URL gerekli",
  altText: "Alternatif metin",
  altTextHint: "Ekran okuyucular için görseli tanımla",
  caption: "Açıklama",
  captionHint: "Görselin altında gösterilir",
  maxWidth: "Azami genişlik",
  auto: "otomatik",
  fixed: "sabit",
  responsive: "duyarlı / doğal",
  title: "Başlık",
  poster: "Kapak görseli",
  aspectRatio: "En-boy oranı",
  playerOptions: "Oynatıcı seçenekleri",
  autoplay: "Otomatik oynat",
  mute: "Sessiz",
  loop: "Döngü",
  showControls: "Kontrolleri göster",
  preload: "Ön yükleme",
  startAt: "Başlangıç",
  seconds: "saniye",
  requiredByAutoplay: "otomatik oynatma için zorunlu",
  optional: "opsiyonel",

  imageId: "Resim ID",
  videoId: "Video ID",
  resolvedUrl: "Çözümlenen URL",
  resolving: "Çözümleniyor…",
  notFoundForId: "Bu ID için içerik bulunamadı",
  idOrUrlRequired: "ID veya URL gerekli",
  urlNotStoredHint: "URL belgeye kaydedilmez — önizleme ID’den çözülür.",
  urlDisabledHint: "ID girersen URL alanı devre dışı kalır.",
  insertImage: "Resim ekle",
  imageBlock: "Resim",
  chooseImage: "Görsel seç",
  noImagesAvailable: "Seçilebilecek görsel yok",
  loadingImages: "Görseller yükleniyor…",
  clearSelection: "Seçimi temizle",
};

export const enMessages: RichTextMessages = {
  cancel: "Cancel",
  save: "Save",
  insert: "Insert",
  embed: "Embed",
  delete: "Delete",
  add: "Add",
  update: "Update",
  removeLink: "Remove link",

  searchBlocks: "Search blocks…",
  noBlocksFound: "No matching block",
  insertBlock: "Insert block",

  url: "URL",
  urlRequired: "URL is required",
  altText: "Alt text",
  altTextHint: "Describe the image for screen readers",
  caption: "Caption",
  captionHint: "Shown below the image",
  maxWidth: "Max width",
  auto: "auto",
  fixed: "fixed",
  responsive: "responsive / natural",
  title: "Title",
  poster: "Poster",
  aspectRatio: "Aspect ratio",
  playerOptions: "Player options",
  autoplay: "Autoplay",
  mute: "Mute",
  loop: "Loop",
  showControls: "Show controls",
  preload: "Preload",
  startAt: "Start at",
  seconds: "seconds",
  requiredByAutoplay: "required by autoplay",
  optional: "optional",

  imageId: "Image ID",
  videoId: "Video ID",
  resolvedUrl: "Resolved URL",
  resolving: "Resolving…",
  notFoundForId: "Nothing found for this ID",
  idOrUrlRequired: "An ID or a URL is required",
  urlNotStoredHint: "The URL is not stored — the preview resolves from the ID.",
  urlDisabledHint: "Entering an ID disables the URL field.",
  insertImage: "Embed image",
  imageBlock: "Image",
  chooseImage: "Choose an image",
  noImagesAvailable: "No images to choose from",
  loadingImages: "Loading images…",
  clearSelection: "Clear selection",
};

export type RichTextLocale = "tr" | "en";

export const LOCALE_MESSAGES: Record<RichTextLocale, RichTextMessages> = {
  tr: trMessages,
  en: enMessages,
};

/** Turkish is the default — this editor's primary audience. */
export const DEFAULT_LOCALE: RichTextLocale = "tr";

const MessagesContext = React.createContext<RichTextMessages | null>(null);

/** Resolve the `locale` / `messages` props into one catalog. */
export function resolveMessages(
  locale: RichTextLocale = DEFAULT_LOCALE,
  overrides?: Partial<RichTextMessages>,
): RichTextMessages {
  const base = LOCALE_MESSAGES[locale] ?? trMessages;
  return overrides ? { ...base, ...overrides } : base;
}

export function RichTextI18nProvider({
  children,
  messages,
}: {
  children: React.ReactNode;
  messages: RichTextMessages;
}) {
  return (
    <MessagesContext.Provider value={messages}>
      {children}
    </MessagesContext.Provider>
  );
}

/**
 * The active message catalog. Falls back to Turkish outside a provider so
 * components stay renderable in isolation (tests, Storybook fragments).
 */
export function useMessages(): RichTextMessages {
  return React.useContext(MessagesContext) ?? trMessages;
}
