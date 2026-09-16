/**
 * Turkish language layer on top of the dictionary: casing, tokenising,
 * and the mistakes Hunspell alone handles badly. Pure functions only, so
 * the live plugin and the headless `checkSpelling()` agree exactly.
 */

const LOCALE = "tr-TR";

export const trLower = (s: string) => s.toLocaleLowerCase(LOCALE);
export const trUpper = (s: string) => s.toLocaleUpperCase(LOCALE);

/** `istanbul` → `İstanbul` — the plain `toUpperCase()` gives `Istanbul`. */
export const trCapitalize = (s: string) =>
  s.length === 0 ? s : trUpper(s[0]) + s.slice(1);

const hasLetters = (s: string) => trLower(s) !== trUpper(s);

export function isAllCaps(word: string): boolean {
  const letters = word.replace(/['’]/g, "");
  return letters.length >= 2 && hasLetters(letters) && letters === trUpper(letters);
}

export function isCapitalized(word: string): boolean {
  const first = word[0] ?? "";
  return first !== trLower(first) && !isAllCaps(word);
}

/** An uppercase letter after the first — `iPhone`, `YouTube`, `McDonald`. */
export function hasInnerCaps(word: string): boolean {
  const rest = word.slice(1).replace(/['’].*$/, "");
  return rest !== trLower(rest) && !isAllCaps(word);
}

// ── tokenising ────────────────────────────────────────────────────────

export interface WordToken {
  word: string;
  start: number;
  end: number;
  /** First word of a sentence (or block) — capitals there prove nothing. */
  sentenceStart: boolean;
}

/**
 * Spans that are not prose: links, addresses, handles, hashtags,
 * file-like names. Blanked out (same length, so offsets survive) before
 * words are picked out.
 */
const NON_PROSE =
  /(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+|[@#][\p{L}\p{N}_]+|\b[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+\b/gu;

const WORD = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)?/gu;

const SENTENCE_END = /[.!?…:;\n]/;
const OPENERS = /[\s"“”'‘’«»([{\-–—]/;

export function tokenize(text: string): WordToken[] {
  const masked = text.replace(NON_PROSE, (m) => " ".repeat(m.length));
  const tokens: WordToken[] = [];

  for (const match of masked.matchAll(WORD)) {
    const start = match.index ?? 0;
    const word = match[0];
    const end = start + word.length;
    const before = masked[start - 1] ?? "";
    const after = masked[end] ?? "";

    // Glued to digits or a code-ish symbol: `2024'te`, `3üncü`, `a_b`, `x/y`.
    if (/[\p{N}_/\\]/u.test(before) || /[\p{N}_/\\]/u.test(after)) continue;
    // A suffix whose stem was masked or numeric: the `te` in `2024'te`.
    if (/['’]/.test(before)) continue;

    let i = start - 1;
    while (i >= 0 && OPENERS.test(masked[i])) {
      if (masked[i] === "\n") break;
      i--;
    }
    const sentenceStart = i < 0 || SENTENCE_END.test(masked[i]);

    tokens.push({ word, start, end, sentenceStart });
  }
  return tokens;
}

// ── rules the dictionary misses ───────────────────────────────────────

/**
 * Frequent wrong forms (TDK Yazım Kılavuzu), keyed in lowercase. Many of
 * these are rejected by the dictionary too, but its suggestion for them
 * is often poor (`şöför` → `flaşör`) — the rule puts the right one first.
 */
export const TURKISH_COMMON_MISTAKES: Record<string, string> = {
  herkez: "herkes",
  yanlız: "yalnız",
  yanlızca: "yalnızca",
  yanlızlık: "yalnızlık",
  yalnış: "yanlış",
  yalnışlık: "yanlışlık",
  şöför: "şoför",
  birşey: "bir şey",
  herşey: "her şey",
  hiçbirşey: "hiçbir şey",
  birsürü: "bir sürü",
  pekçok: "pek çok",
  hergün: "her gün",
  herzaman: "her zaman",
  hiçbirzaman: "hiçbir zaman",
  malesef: "maalesef",
  maalesf: "maalesef",
  orjinal: "orijinal",
  orjinali: "orijinali",
  entellektüel: "entelektüel",
  süpriz: "sürpriz",
  makina: "makine",
  labaratuvar: "laboratuvar",
  laboratuar: "laboratuvar",
  egzos: "egzoz",
  egsoz: "egzoz",
  eksoz: "egzoz",
  egsersiz: "egzersiz",
  eksersiz: "egzersiz",
  sandoviç: "sandviç",
  profösör: "profesör",
  aşşağı: "aşağı",
  yukarda: "yukarıda",
  orda: "orada",
  burda: "burada",
  şurda: "şurada",
  traş: "tıraş",
  kirbit: "kibrit",
  eşortman: "eşofman",
  eşşek: "eşek",
  klavuz: "kılavuz",
  meyva: "meyve",
  cimnastik: "jimnastik",
  antreman: "antrenman",
  kordinasyon: "koordinasyon",
  kordinatör: "koordinatör",
  tesbit: "tespit",
  bilimum: "bilumum",
  hakkaten: "hakikaten",
  zatüre: "zatürre",
  döküman: "doküman",
  espiri: "espri",
  gardolap: "gardırop",
  gardrop: "gardırop",
  kapşon: "kapüşon",
  mahsüs: "mahsus",
  mütevazi: "mütevazı",
  parlemento: "parlamento",
  sağol: "sağ ol",
  şarz: "şarj",
  tamamiyle: "tamamıyla",
  zerafet: "zarafet",
  poaça: "poğaça",
  kıravat: "kravat",
  kurdale: "kurdele",
  müsade: "müsaade",
  teşekür: "teşekkür",
  teşekürler: "teşekkürler",
  deyil: "değil",
  deyilmi: "değil mi",
  tabiki: "tabii ki",
  yada: "ya da",
  birkez: "bir kez",
  birdaha: "bir daha",
  hiçkimse: "hiç kimse",
  herbiri: "her biri",
  herhangibir: "herhangi bir",
  şuanda: "şu anda",
  şuan: "şu an",
  yinede: "yine de",
};
// Deliberately absent: attached de/da forms that are also valid words
// (`bende`, `sende`, `evde`) — only the dictionary-rejected ones are
// caught, by `cliticSplits` below.

/**
 * Question particle and conjunctions TDK writes separately. Each carries
 * the last-vowel classes it may follow, so `değil mi` is offered but
 * `değil mı` never is.
 */
const CLITICS: { suffix: string; after: RegExp | null }[] = [
  ...["mi", "misin", "miyim", "miyiz", "misiniz", "midir"].map(
    (suffix) => ({ suffix, after: /[ei]/ }),
  ),
  ...["mı", "mısın", "mıyım", "mıyız", "mısınız", "mıdır"].map((suffix) => ({
    suffix,
    after: /[aı]/,
  })),
  ...["mu", "musun", "muyum", "muyuz", "musunuz", "mudur"].map((suffix) => ({
    suffix,
    after: /[ou]/,
  })),
  ...["mü", "müsün", "müyüm", "müyüz", "müsünüz", "müdür"].map((suffix) => ({
    suffix,
    after: /[öü]/,
  })),
  { suffix: "de", after: /[eiöü]/ },
  { suffix: "da", after: /[aıou]/ },
  { suffix: "ki", after: null },
];

const lastVowel = (s: string) => {
  const m = trLower(s).match(/[aeıioöuü](?=[^aeıioöuü]*$)/);
  return m ? m[0] : "";
};

/**
 * `değilmi` → `[{ stem: "değil", clitic: "mi" }]`. The caller confirms
 * the stem against the dictionary; only harmonic pairs are proposed.
 * Longest suffix first, so `değilmisin` splits as `değil misin`.
 */
export function cliticSplits(word: string): { stem: string; clitic: string }[] {
  if (/['’]/.test(word)) return [];
  const lower = trLower(word);
  const out: { stem: string; clitic: string }[] = [];
  const sorted = [...CLITICS].sort((a, b) => b.suffix.length - a.suffix.length);
  for (const { suffix, after } of sorted) {
    if (!lower.endsWith(suffix)) continue;
    const stem = word.slice(0, word.length - suffix.length);
    if (stem.length < 2) continue;
    if (after && !after.test(lastVowel(stem))) continue;
    out.push({ stem, clitic: word.slice(stem.length) });
  }
  return out;
}

/**
 * Words TDK writes apart from what follows (`her şey`, `bir şey`,
 * `hiçbir zaman`, `pek çok`). Covers inflected forms the rule list can't
 * enumerate — `herşeyi`, `birşeyler`, `hiçbirzaman` — once the caller
 * confirms the remainder is a dictionary word.
 */
const SEPARATE_HEADS = ["hiçbir", "herhangi", "her", "bir", "hiç", "pek", "şu", "ya"];

export function headSplits(word: string): { stem: string; clitic: string }[] {
  if (/['’]/.test(word)) return [];
  const lower = trLower(word);
  const out: { stem: string; clitic: string }[] = [];
  for (const head of SEPARATE_HEADS) {
    if (!lower.startsWith(head)) continue;
    const rest = word.slice(head.length);
    if (rest.length < 3) continue;
    out.push({ stem: word.slice(0, head.length), clitic: rest });
  }
  return out;
}

// ── shaping suggestions ───────────────────────────────────────────────

/** Letters Turkish writers swap — vowel harmony and missing diacritics. */
const NEAR: Record<string, string> = {
  a: "e", e: "a", ı: "i", i: "ı", o: "ö", ö: "o", u: "ü", ü: "u",
  s: "ş", ş: "s", c: "ç", ç: "c", g: "ğ", ğ: "g",
};

/**
 * Edit distance where a near letter (`a`↔`e`, `s`↔`ş`…) costs half and
 * an adjacent swap costs one. Used only to re-rank Hunspell's candidates,
 * whose own order ignores these Turkish-specific confusions.
 */
export function turkishDistance(a: string, b: string): number {
  const x = trLower(a);
  const y = trLower(b);
  const d: number[][] = Array.from({ length: x.length + 1 }, (_, i) =>
    Array.from({ length: y.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= x.length; i++) {
    for (let j = 1; j <= y.length; j++) {
      const sub =
        x[i - 1] === y[j - 1] ? 0 : NEAR[x[i - 1]] === y[j - 1] ? 0.5 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + sub);
      if (i > 1 && j > 1 && x[i - 1] === y[j - 2] && x[i - 2] === y[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[x.length][y.length];
}

/** Give a suggestion the casing and apostrophe style of what was typed. */
export function matchCase(original: string, suggestion: string): string {
  let out = suggestion;
  if (isAllCaps(original)) out = trUpper(out);
  else if (isCapitalized(original)) out = trCapitalize(out);
  if (original.includes("’")) out = out.replace(/'/g, "’");
  return out;
}

/**
 * Hunspell pads its list with mechanical splits and hyphenations
 * (`yapıca m`, `ki tab`, `herk ez`, `yapı-cam`) — drop those, match
 * casing, dedupe, and keep the list short.
 */
export function cleanSuggestions(
  original: string,
  raw: string[],
  limit = 6,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const originalHasHyphen = original.includes("-");
  const ranked = raw
    .map((candidate, index) => ({
      candidate,
      index,
      distance: turkishDistance(original, candidate),
    }))
    .sort((p, q) => p.distance - q.distance || p.index - q.index)
    .map((entry) => entry.candidate);

  for (const candidate of ranked) {
    if (!candidate) continue;
    if (!originalHasHyphen && candidate.includes("-")) continue;
    const parts = candidate.split(" ");
    if (parts.length > 1 && parts.some((p) => p.length < 2)) continue;

    const shaped = matchCase(original, candidate);
    if (shaped === original || seen.has(shaped)) continue;
    seen.add(shaped);
    out.push(shaped);
    if (out.length >= limit) break;
  }
  return out;
}

/** Normalise what the engine sees: curly apostrophes → `'`. */
export const toEngineWord = (word: string) => word.replace(/’/g, "'");
