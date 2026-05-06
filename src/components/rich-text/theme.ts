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
    checklist: "list-none pl-0 mb-2",
    listitemChecked:
      "relative pl-7 mb-1 line-through text-zinc-500 before:absolute before:left-0 before:top-1 before:size-4 before:rounded before:border before:border-blue-500 before:bg-blue-500 before:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%223%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22><polyline%20points=%2220%206%209%2017%204%2012%22/></svg>')] before:bg-no-repeat before:bg-center before:bg-[length:14px_14px] before:cursor-pointer",
    listitemUnchecked:
      "relative pl-7 mb-1 before:absolute before:left-0 before:top-1 before:size-4 before:rounded before:border before:border-zinc-300 before:bg-white before:cursor-pointer hover:before:border-zinc-400",
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
  hashtag:
    "text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-medium hover:bg-blue-100 cursor-pointer",
  characterLimit: "bg-red-100",
};
