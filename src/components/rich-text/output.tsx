"use client";

import * as React from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot } from "lexical";
import { cn } from "../../lib/utils";
import { CheckIcon, CopyIcon, DownloadIcon } from "../../lib/icons";

export type RichTextOutputTab = "html" | "markdown" | "json" | "text";

interface OutputValue {
  html: string;
  markdown: string;
  json: string;
  text: string;
}

export interface RichTextOutputProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Tabs to render. Default: all four. */
  tabs?: RichTextOutputTab[];
  /** Active tab on first render. Default: first entry in `tabs`. */
  defaultTab?: RichTextOutputTab;
  /** Show the Copy button. Default: `true`. */
  showCopy?: boolean;
  /** Show the Download button. Default: `true`. */
  showDownload?: boolean;
  /** Filename stem for downloads. Final name is `${downloadName}.{ext}`. Default: `richtext`. */
  downloadName?: string;
  /** Max content height (Tailwind class). Default: `max-h-72`. */
  maxHeight?: string;
}

const TAB_LABELS: Record<RichTextOutputTab, string> = {
  html: "HTML",
  markdown: "Markdown",
  json: "JSON",
  text: "Text",
};

const TAB_EXTENSION: Record<RichTextOutputTab, string> = {
  html: "html",
  markdown: "md",
  json: "json",
  text: "txt",
};

const TAB_MIME: Record<RichTextOutputTab, string> = {
  html: "text/html",
  markdown: "text/markdown",
  json: "application/json",
  text: "text/plain",
};

const EMPTY_VALUE: OutputValue = { html: "", markdown: "", json: "", text: "" };

const ACTION_BUTTON =
  "inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition-colors cursor-pointer hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/15 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-zinc-700 disabled:hover:border-zinc-200";

/**
 * Live serialization panel — tabbed view of the current editor state as
 * HTML, Markdown, Lexical JSON and plain text. Place after `<RichTextContent />`
 * inside `<RichTextEditor>`; subscribes to editor updates via
 * `registerUpdateListener`.
 */
export function RichTextOutput({
  tabs = ["html", "markdown", "json", "text"],
  defaultTab,
  showCopy = true,
  showDownload = true,
  downloadName = "richtext",
  maxHeight = "max-h-72",
  className,
  ...props
}: RichTextOutputProps) {
  const [editor] = useLexicalComposerContext();
  const [value, setValue] = React.useState<OutputValue>(EMPTY_VALUE);
  const [tab, setTab] = React.useState<RichTextOutputTab>(
    defaultTab ?? tabs[0],
  );
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        setValue({
          html: $generateHtmlFromNodes(editor),
          markdown: $convertToMarkdownString(TRANSFORMERS),
          json: JSON.stringify(editor.getEditorState().toJSON()),
          text: $getRoot().getTextContent(),
        });
      });
    };
    update();
    return editor.registerUpdateListener(update);
  }, [editor]);

  const display = React.useMemo(() => {
    if (tab === "json" && value.json) {
      try {
        return JSON.stringify(JSON.parse(value.json), null, 2);
      } catch {
        return value.json;
      }
    }
    return value[tab];
  }, [tab, value]);

  const handleCopy = async () => {
    if (!display || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore clipboard errors */
    }
  };

  const handleDownload = () => {
    if (!display || typeof document === "undefined") return;
    const ext = TAB_EXTENSION[tab];
    const mime = TAB_MIME[tab];
    const blob = new Blob([display], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${downloadName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      data-slot="rich-text-output"
      className={cn(
        "flex flex-col overflow-hidden border-t border-zinc-200 bg-white",
        className,
      )}
      {...props}
    >
      <div
        role="tablist"
        aria-label="Editor output"
        className="flex items-center gap-1 border-b border-zinc-200 bg-zinc-50/60 px-2 py-1.5"
      >
        <div className="flex flex-1 items-center gap-0.5">
          {tabs.map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t)}
                className={cn(
                  "inline-flex h-7 items-center rounded-sm px-2.5 text-xs font-medium transition-colors cursor-pointer",
                  active
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:bg-zinc-200/70 hover:text-zinc-900",
                )}
              >
                {TAB_LABELS[t]}
              </button>
            );
          })}
        </div>
        {(showCopy || showDownload) && (
          <div className="flex items-center gap-1">
            {showCopy && (
              <button
                type="button"
                onClick={handleCopy}
                disabled={!display}
                aria-label={copied ? "Copied" : "Copy to clipboard"}
                className={ACTION_BUTTON}
              >
                {copied ? (
                  <CheckIcon className="size-3.5 text-emerald-600" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            )}
            {showDownload && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={!display}
                aria-label={`Download as .${TAB_EXTENSION[tab]}`}
                className={ACTION_BUTTON}
              >
                <DownloadIcon className="size-3.5" />
                <span>.{TAB_EXTENSION[tab]}</span>
              </button>
            )}
          </div>
        )}
      </div>
      <pre
        className={cn(
          "overflow-auto whitespace-pre-wrap break-words bg-zinc-50/40 p-4 font-mono text-[11px] leading-relaxed text-zinc-700",
          maxHeight,
        )}
      >
        {display || (
          <span className="text-zinc-400 italic">empty</span>
        )}
      </pre>
    </div>
  );
}

RichTextOutput.displayName = "RichTextOutput";
