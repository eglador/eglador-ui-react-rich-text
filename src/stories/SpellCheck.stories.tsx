import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  RichTextEditor,
  RichTextContent,
  RichTextToolbar,
  RichTextSpellCheck,
  checkSpelling,
  createTurkishSpellChecker,
  useRichTextEditor,
  useRichTextSpellCheck,
  type RichTextSpellCheckApi,
  type SpellCheckResult,
} from "../components/rich-text";

/**
 * Storybook serves `dictionary-tr` at /dictionaries/tr (see
 * .storybook/main.ts). In an app, omit `dictionaryUrls` to use the CDN
 * default, or point it at your own copy.
 */
const checker = createTurkishSpellChecker({
  dictionaryUrls: {
    aff: "/dictionaries/tr/index.aff",
    dic: "/dictionaries/tr/index.dic",
  },
});

const SAMPLE_HTML = `
<h2>Yazım denetimi örneği</h2>
<p>Herkez bugün toplantıya geldi ama yanlız Ahmet gelmedi. Bu sorunu çözdük değilmi? Belkide yarın konuşuruz.</p>
<p>istanbul'da yaşayan Kılıçdaroğlu açıklama yaptı, TBMM toplandı. Orjinal belgeyi kitaplarımızdan çıkardık, şöför bekliyor.</p>
<p>Eglador'un yeni editörü iPhone ve YouTube ile çalışıyor. Detaylar https://eglador.com/haber adresinde, 2024'te yayınlandı.</p>
<p>Gazeteci haberi yazarkan birkaç kelimeyi yanlş yazdı.</p>
`;

const meta: Meta = {
  title: "Rich Text/Spell Check",
  parameters: { layout: "padded" },
};
export default meta;

type Story = StoryObj;

// ── 1. default UI + external result panel ──────────────────────────────

function ResultPanel({ result }: { result: SpellCheckResult }) {
  return (
    <aside className="w-80 shrink-0 rounded-lg border border-zinc-200 bg-white text-xs">
      <div className="px-3 py-2 border-b border-zinc-200 font-medium text-zinc-700">
        onResult çıktısı
      </div>
      <div className="px-3 py-2 flex items-center gap-2">
        <span
          data-testid="spell-passed"
          className={
            result.passed
              ? "px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold"
              : "px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold"
          }
        >
          passed: {String(result.passed)}
        </span>
        <span className="text-zinc-500">status: {result.status}</span>
      </div>
      <pre
        data-testid="spell-json"
        className="px-3 pb-3 max-h-[420px] overflow-auto text-[10px] leading-snug text-zinc-700"
      >
        {JSON.stringify(
          {
            passed: result.passed,
            status: result.status,
            issueCount: result.issueCount,
            checkedWordCount: result.checkedWordCount,
            issues: result.issues.map(({ word, kind, suggestions, context }) => ({
              word,
              kind,
              suggestions,
              context,
            })),
          },
          null,
          2,
        )}
      </pre>
    </aside>
  );
}

export const Default: Story = {
  name: "Türkçe yazım denetimi",
  render: () => {
    const [result, setResult] = React.useState<SpellCheckResult | null>(null);
    return (
      <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0">
          <RichTextEditor initialHtml={SAMPLE_HTML}>
            <RichTextToolbar />
            <RichTextContent minHeight="min-h-64" />
            <RichTextSpellCheck checker={checker} onResult={setResult} />
          </RichTextEditor>
          <p className="mt-2 text-xs text-zinc-500">
            Altı çizili kelimeye tıkla (veya sağ tıkla) → öneriler. Alt
            çubuktaki “Hataları göster” listesi kelimeye götürür.
          </p>
        </div>
        {result && <ResultPanel result={result} />}
      </div>
    );
  },
};

// ── 2. publish gate driven from outside the editor ─────────────────────

export const PublishGate: Story = {
  name: "Yayın öncesi kontrol (apiRef)",
  render: () => {
    const api = React.useRef<RichTextSpellCheckApi>(null);
    const [report, setReport] = React.useState<SpellCheckResult | null>(null);
    const [published, setPublished] = React.useState(false);

    const publish = async () => {
      setPublished(false);
      // Checks the document as it is right now — debounce skipped,
      // suggestions awaited so the error screen can show them.
      const result = await api.current!.check({ suggestions: true });
      if (result.passed) {
        setReport(null);
        setPublished(true);
      } else {
        setReport(result);
      }
    };

    return (
      <div className="max-w-3xl">
        <RichTextEditor initialHtml="<p>Herkez bu haberi okumalı, malesef geç kaldık.</p>">
          <RichTextToolbar />
          <RichTextContent />
          <RichTextSpellCheck checker={checker} apiRef={api} showStatus={false} />
        </RichTextEditor>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            data-testid="publish"
            onClick={publish}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 cursor-pointer"
          >
            Yayınla
          </button>
          {published && (
            <span data-testid="published" className="text-sm text-emerald-700 font-medium">
              ✓ Yayınlandı — yazım hatası yok
            </span>
          )}
        </div>

        {report && (
          <div
            role="alert"
            data-testid="error-screen"
            className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm"
          >
            <div className="font-semibold text-red-800">
              Yayınlanamadı: {report.issueCount} yazım hatası
            </div>
            <ul className="mt-2 space-y-1">
              {report.issues.map((issue) => (
                <li key={issue.id} className="flex items-center gap-2">
                  <span className="text-red-700 line-through">{issue.word}</span>
                  <span className="text-zinc-400">→</span>
                  {issue.suggestions.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-testid="apply-fix"
                      onClick={() => {
                        api.current!.applySuggestion(issue.id, s);
                        void publish();
                      }}
                      className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => api.current!.focusIssue(issue.id)}
                    className="ml-auto text-xs text-zinc-500 hover:underline cursor-pointer"
                  >
                    Metinde göster
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
};

// ── 3. custom UI from inside the editor tree ───────────────────────────

function PublishButton() {
  const { result } = useRichTextSpellCheck();
  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-200 bg-zinc-50">
      <span data-testid="hook-status" className="text-xs text-zinc-600">
        {result.status === "loading" || result.status === "checking"
          ? "Kontrol ediliyor…"
          : result.passed
            ? "Metin temiz"
            : `${result.issueCount} sorun var`}
      </span>
      <button
        type="button"
        disabled={!result.passed}
        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium disabled:bg-zinc-300 disabled:cursor-not-allowed cursor-pointer"
      >
        Yayınla
      </button>
    </div>
  );
}

export const CustomUi: Story = {
  name: "Özel arayüz (useRichTextSpellCheck)",
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor initialHtml="<p>Hergün yeni bir şey öğreniyoruz, yinede eksik kalıyor.</p>">
        <RichTextToolbar />
        <RichTextContent />
        <RichTextSpellCheck checker={checker}>
          {({ result }) => (
            <div className="px-3 py-1.5 border-t border-zinc-200 text-xs">
              {result.issues.map((i) => (
                <span
                  key={i.id}
                  className="inline-block mr-2 mb-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900"
                >
                  {i.word} → {i.suggestions[0] ?? "?"}
                </span>
              ))}
            </div>
          )}
        </RichTextSpellCheck>
        <PublishButton />
      </RichTextEditor>
    </div>
  ),
};

// ── 4. headless: check JSON without the plugin ─────────────────────────

function HeadlessDemo() {
  const { getRawJson } = useRichTextEditor();
  const [result, setResult] = React.useState<SpellCheckResult | null>(null);
  return (
    <div className="p-3 border-t border-zinc-200 text-xs space-y-2">
      <button
        type="button"
        data-testid="headless-run"
        onClick={async () => setResult(await checkSpelling(getRawJson(), { checker }))}
        className="px-3 py-1.5 rounded-md bg-zinc-900 text-white cursor-pointer"
      >
        checkSpelling(json) çalıştır
      </button>
      {result && (
        <pre data-testid="headless-result" className="bg-zinc-50 p-2 rounded overflow-auto">
          {JSON.stringify(
            {
              passed: result.passed,
              issues: result.issues.map((i) => [i.word, i.suggestions]),
            },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  );
}

export const Headless: Story = {
  name: "Editörsüz denetim (checkSpelling)",
  render: () => (
    <div className="max-w-3xl">
      <RichTextEditor initialHtml="<p>Sunucuya göndermeden önce herşeyi kontrol et, orjinal metin bu.</p>">
        <RichTextContent />
        <HeadlessDemo />
      </RichTextEditor>
    </div>
  ),
};
