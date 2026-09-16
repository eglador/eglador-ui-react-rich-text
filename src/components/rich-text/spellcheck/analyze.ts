import {
  TURKISH_COMMON_MISTAKES,
  cleanSuggestions,
  cliticSplits,
  hasInnerCaps,
  headSplits,
  isAllCaps,
  isCapitalized,
  matchCase,
  toEngineWord,
  tokenize,
  trLower,
} from "./turkish";
import type {
  SpellAnalysisOptions,
  SpellCheckResult,
  SpellChecker,
  SpellIssue,
  SpellIssueKind,
  SpellIssuePoint,
} from "./types";

/** A run of prose — one paragraph, heading, list item, table cell… */
export interface SpellSegment {
  text: string;
  blockIndex: number;
  /** Map an offset inside `text` to a live-editor point (plugin only). */
  locate?: (offset: number, edge: "start" | "end") => SpellIssuePoint | null;
}

export interface SpellIssueMessages {
  spellMisspelling: string;
  spellCommonMistake: string;
  spellSeparateWords: string;
}

export const DEFAULT_ISSUE_MESSAGES: SpellIssueMessages = {
  spellMisspelling: "Sözlükte bulunamadı",
  spellCommonMistake: "Yaygın yazım yanlışı",
  spellSeparateWords: "Ayrı yazılmalı",
};

export interface SpellCaches {
  /** engine word → spelled correctly */
  verdicts: Map<string, boolean>;
  /** word as written → cleaned suggestions */
  suggestions: Map<string, string[]>;
}

export const createSpellCaches = (): SpellCaches => ({
  verdicts: new Map(),
  suggestions: new Map(),
});

const messageFor = (kind: SpellIssueKind, m: SpellIssueMessages) =>
  kind === "common-mistake"
    ? m.spellCommonMistake
    : kind === "separate-words"
      ? m.spellSeparateWords
      : m.spellMisspelling;

function snippet(text: string, start: number, end: number, radius = 32) {
  let from = Math.max(0, start - radius);
  let to = Math.min(text.length, end + radius);
  // Don't cut words in half at the edges.
  if (from > 0) {
    const space = text.indexOf(" ", from);
    if (space !== -1 && space < start) from = space + 1;
  }
  if (to < text.length) {
    const space = text.lastIndexOf(" ", to);
    if (space > end) to = space;
  }
  return (
    (from > 0 ? "…" : "") +
    text.slice(from, to).replace(/\s+/g, " ").trim() +
    (to < text.length ? "…" : "")
  );
}

/** Ask the engine only about words it hasn't answered before. */
async function resolveVerdicts(
  words: Iterable<string>,
  checker: SpellChecker,
  caches: SpellCaches,
) {
  const unknown = [...new Set(words)].filter((w) => !caches.verdicts.has(w));
  if (unknown.length === 0) return;
  const answers = await checker.check(unknown);
  unknown.forEach((word, i) => caches.verdicts.set(word, answers[i] === true));
}

/**
 * Find every issue in `segments`. Rule-based issues arrive with their
 * suggestion; dictionary misses arrive with `suggestionsPending: true` —
 * run `fillSuggestions` afterwards (it is slower, ~100 ms per word).
 */
export async function analyzeSegments(
  segments: SpellSegment[],
  checker: SpellChecker,
  options: SpellAnalysisOptions = {},
  messages: SpellIssueMessages = DEFAULT_ISSUE_MESSAGES,
  caches: SpellCaches = createSpellCaches(),
): Promise<{ issues: SpellIssue[]; checkedWordCount: number }> {
  const {
    ignoreProperNouns = true,
    ignoreAllCaps = true,
    minWordLength = 2,
  } = options;
  const ignore = new Set((options.ignoreWords ?? []).map(trLower));
  const mistakes: Record<string, string> = { ...TURKISH_COMMON_MISTAKES };
  for (const [wrong, right] of Object.entries(options.commonMistakes ?? {})) {
    if (right === null) delete mistakes[trLower(wrong)];
    else mistakes[trLower(wrong)] = right;
  }

  type Candidate = {
    segment: SpellSegment;
    word: string;
    start: number;
    end: number;
    sentenceStart: boolean;
  };
  const ruleHits: (Candidate & { fix: string })[] = [];
  const dictionaryCandidates: Candidate[] = [];
  const distinct = new Set<string>();

  for (const segment of segments) {
    for (const token of tokenize(segment.text)) {
      if (token.word.length < minWordLength) continue;
      const lower = trLower(token.word);
      const stem = lower.split(/['’]/)[0];
      if (ignore.has(lower) || ignore.has(stem)) continue;

      distinct.add(lower);
      const candidate = { segment, ...token };
      const fix = mistakes[lower];
      if (fix) ruleHits.push({ ...candidate, fix });
      else dictionaryCandidates.push(candidate);
    }
  }

  await resolveVerdicts(
    dictionaryCandidates.map((c) => toEngineWord(c.word)),
    checker,
    caches,
  );

  const misses = dictionaryCandidates.filter((c) => {
    if (caches.verdicts.get(toEngineWord(c.word))) return false;
    if (ignoreAllCaps && isAllCaps(c.word)) return false;
    if (ignoreProperNouns) {
      // Mid-sentence capitals, `iPhone`-style inner capitals, and any
      // capitalised stem carrying an apostrophe suffix are names.
      if (hasInnerCaps(c.word)) return false;
      if (isCapitalized(c.word) && (!c.sentenceStart || /['’]/.test(c.word))) {
        return false;
      }
    }
    return true;
  });

  // `değilmi` → is `değil` a word? Then it's `değil mi`.
  // `herşeyi` → is `şeyi` a word? Then it's `her şeyi`.
  const splitsByWord = new Map(
    misses.map((m) => [
      m.word,
      [
        ...cliticSplits(m.word).map((s) => ({ ...s, check: s.stem })),
        ...headSplits(m.word).map((s) => ({ ...s, check: s.clitic })),
      ],
    ]),
  );
  await resolveVerdicts(
    [...splitsByWord.values()].flatMap((splits) =>
      splits.map((s) => toEngineWord(s.check)),
    ),
    checker,
    caches,
  );

  const makeIssue = (
    c: Candidate,
    kind: SpellIssueKind,
    suggestions: string[],
    pending: boolean,
  ): SpellIssue => {
    const anchor = c.segment.locate?.(c.start, "start") ?? undefined;
    const focus = c.segment.locate?.(c.end, "end") ?? undefined;
    return {
      id: anchor
        ? `${anchor.key}:${anchor.offset}:${c.word}`
        : `${c.segment.blockIndex}:${c.start}:${c.word}`,
      word: c.word,
      kind,
      message: messageFor(kind, messages),
      suggestions,
      suggestionsPending: pending,
      context: snippet(c.segment.text, c.start, c.end),
      blockOffset: c.start,
      blockIndex: c.segment.blockIndex,
      ...(anchor && focus ? { anchor, focus } : {}),
    };
  };

  const issues: SpellIssue[] = [
    ...ruleHits.map((c) =>
      makeIssue(c, "common-mistake", [matchCase(c.word, c.fix)], false),
    ),
    ...misses.map((c) => {
      const split = splitsByWord
        .get(c.word)!
        .find((s) => caches.verdicts.get(toEngineWord(s.check)));
      if (split) {
        return makeIssue(c, "separate-words", [`${split.stem} ${split.clitic}`], false);
      }
      const cached = caches.suggestions.get(c.word);
      return makeIssue(c, "misspelling", cached ?? [], cached === undefined);
    }),
  ];

  issues.sort((a, b) => a.blockIndex - b.blockIndex || a.blockOffset - b.blockOffset);
  return { issues, checkedWordCount: distinct.size };
}

/** Dictionary suggestions for one word, cleaned and cached. */
export async function suggestWord(
  word: string,
  checker: SpellChecker,
  caches: SpellCaches,
): Promise<string[]> {
  const cached = caches.suggestions.get(word);
  if (cached) return cached;
  const raw = await checker.suggest(toEngineWord(word));
  const cleaned = cleanSuggestions(word, raw);
  caches.suggestions.set(word, cleaned);
  return cleaned;
}

/**
 * Fill in every pending issue's suggestions, one distinct word at a
 * time. `onProgress` gets a fresh issue list after each word, so a UI
 * can show suggestions as they arrive; `isStale` aborts early.
 */
export async function fillSuggestions(
  issues: SpellIssue[],
  checker: SpellChecker,
  caches: SpellCaches,
  onProgress?: (issues: SpellIssue[]) => void,
  isStale?: () => boolean,
): Promise<SpellIssue[]> {
  let current = issues;
  const words = [
    ...new Set(issues.filter((i) => i.suggestionsPending).map((i) => i.word)),
  ];
  for (const word of words) {
    if (isStale?.()) return current;
    const suggestions = await suggestWord(word, checker, caches);
    current = current.map((issue) =>
      issue.word === word && issue.suggestionsPending
        ? { ...issue, suggestions, suggestionsPending: false }
        : issue,
    );
    onProgress?.(current);
  }
  return current;
}

export function buildResult(
  issues: SpellIssue[],
  checkedWordCount: number,
): SpellCheckResult {
  return {
    status: issues.length === 0 ? "passed" : "failed",
    passed: issues.length === 0,
    issueCount: issues.length,
    issues,
    checkedWordCount,
    checkedAt: Date.now(),
  };
}

// ── headless: Lexical JSON / plain text ───────────────────────────────

/** Inline element types whose text belongs to the surrounding block. */
const INLINE_ELEMENTS = new Set(["link", "autolink", "mark", "overflow"]);
const IS_CODE = 16;

interface JsonNode {
  type?: string;
  text?: string;
  format?: number | string;
  children?: JsonNode[];
}

/** Blocks of prose from a serialized editor state, in document order. */
export function segmentsFromJson(state: unknown): SpellSegment[] {
  const segments: SpellSegment[] = [];
  const root = (state as { root?: JsonNode })?.root ?? (state as JsonNode);

  const walkBlock = (block: JsonNode) => {
    if (block.type === "code") return;
    let text = "";
    const flush = () => {
      if (text.trim()) segments.push({ text, blockIndex: segments.length });
      text = "";
    };
    const walkInline = (nodes: JsonNode[]) => {
      for (const node of nodes) {
        if (node.type === "text") {
          const code = typeof node.format === "number" && node.format & IS_CODE;
          text += code ? " ".repeat(node.text?.length ?? 0) : (node.text ?? "");
        } else if (node.type === "hashtag") {
          text += " ".repeat(node.text?.length ?? 0);
        } else if (node.type === "linebreak") {
          text += "\n";
        } else if (node.type === "tab") {
          text += "\t";
        } else if (node.children && INLINE_ELEMENTS.has(node.type ?? "")) {
          walkInline(node.children);
        } else if (node.children) {
          flush();
          walkBlock(node);
        }
      }
    };
    walkInline(block.children ?? []);
    flush();
  };

  walkBlock(root);
  return segments;
}

export interface CheckSpellingOptions extends SpellAnalysisOptions {
  checker: SpellChecker;
  /** Look up dictionary suggestions too (slower). Default `true`. */
  suggestions?: boolean;
  messages?: Partial<SpellIssueMessages>;
}

/**
 * Spell-check content outside an editor — before saving, in an API
 * route, in CI. Accepts plain text, a Lexical JSON string, or a parsed
 * editor state. Resolves to the same `SpellCheckResult` the plugin emits
 * (without `anchor` / `focus`, since there is no live editor).
 *
 * ```ts
 * const result = await checkSpelling(json, { checker });
 * if (!result.passed) return res.status(422).json(result.issues);
 * ```
 */
export async function checkSpelling(
  input: string | object,
  { checker, suggestions = true, messages, ...options }: CheckSpellingOptions,
): Promise<SpellCheckResult> {
  let segments: SpellSegment[];
  if (typeof input === "string") {
    let parsed: unknown = null;
    if (input.trimStart().startsWith("{")) {
      try {
        parsed = JSON.parse(input);
      } catch {
        parsed = null;
      }
    }
    segments = parsed
      ? segmentsFromJson(parsed)
      : input
          .split(/\n/)
          .map((text, blockIndex) => ({ text, blockIndex }))
          .filter((s) => s.text.trim());
  } else {
    segments = segmentsFromJson(input);
  }

  try {
    const caches = createSpellCaches();
    const { issues, checkedWordCount } = await analyzeSegments(
      segments,
      checker,
      options,
      { ...DEFAULT_ISSUE_MESSAGES, ...messages },
      caches,
    );
    const final = suggestions
      ? await fillSuggestions(issues, checker, caches)
      : issues;
    return buildResult(final, checkedWordCount);
  } catch (error) {
    return {
      status: "error",
      passed: false,
      issueCount: 0,
      issues: [],
      checkedWordCount: 0,
      checkedAt: Date.now(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
