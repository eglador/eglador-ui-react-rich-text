import type { EditorThemeClasses } from "lexical";

/**
 * Default Tailwind v4 theme — Lexical class name map.
 * User can override by passing their own theme via Carousel root.
 */
export const defaultTheme: EditorThemeClasses = {
  paragraph: "mb-2 last:mb-0 leading-relaxed",
  heading: {
    h1: "text-3xl font-bold mt-4 mb-2 text-zinc-900",
    h2: "text-2xl font-semibold mt-3 mb-2 text-zinc-900",
    h3: "text-xl font-semibold mt-3 mb-2 text-zinc-900",
    h4: "text-lg font-semibold mt-2 mb-1 text-zinc-900",
    h5: "text-base font-semibold mt-2 mb-1 text-zinc-900",
    h6: "text-sm font-semibold mt-2 mb-1 text-zinc-900",
  },
  list: {
    ul: "list-disc list-outside pl-6 mb-2",
    ol: "list-decimal list-outside pl-6 mb-2",
    listitem: "mb-1",
    nested: {
      listitem: "list-none",
    },
  },
  quote:
    "border-l-4 border-zinc-300 pl-4 italic text-zinc-700 my-2",
  link: "text-blue-600 underline underline-offset-2 hover:text-blue-700 cursor-pointer",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    code: "font-mono bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded text-[0.9em]",
    subscript: "align-sub text-xs",
    superscript: "align-super text-xs",
  },
  code: "block font-mono bg-zinc-900 text-zinc-100 p-3 rounded my-2 overflow-x-auto text-sm",
  table:
    "border-collapse border border-zinc-300 my-2 w-full table-fixed",
  tableRow: "",
  tableCell:
    "border border-zinc-300 px-3 py-2 align-top relative min-w-[80px]",
  tableCellHeader:
    "border border-zinc-300 px-3 py-2 align-top relative min-w-[80px] bg-zinc-50 font-semibold",
  tableSelected: "outline outline-2 outline-blue-500",
  tableCellSelected: "bg-blue-100",
};
