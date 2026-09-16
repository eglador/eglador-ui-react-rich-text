/**
 * The contract every spell-check surface shares — the editor plugin, the
 * headless `checkSpelling()` helper, and whatever the host builds on the
 * result (an error screen, a publish gate, an analytics hook).
 */

/**
 * A spelling engine. The built-in one is Hunspell with a Turkish
 * dictionary (`createTurkishSpellChecker`); anything implementing this
 * interface can replace it — a server endpoint backed by Zemberek, a
 * different language, a test double.
 *
 * Words arrive exactly as written (case and apostrophe suffixes intact);
 * the engine decides what counts as correct.
 */
export interface SpellChecker {
  /** Resolves once the engine can answer. Safe to call repeatedly. */
  ready(): Promise<void>;
  /** One boolean per word, same order: `true` = spelled correctly. */
  check(words: string[]): Promise<boolean[]>;
  /** Replacement candidates for one word, best first. */
  suggest(word: string): Promise<string[]>;
  /** Accept a word for the rest of this engine's lifetime. */
  addWord?(word: string): Promise<void>;
  /** Release workers / memory. */
  dispose?(): void;
}

export type SpellIssueKind =
  /** The dictionary doesn't know the word. */
  | "misspelling"
  /** A well-known wrong form from the rule list (`herkez` → `herkes`). */
  | "common-mistake"
  /** Written together, belongs apart (`değilmi` → `değil mi`, `herşeyi` → `her şeyi`). */
  | "separate-words";

/** Where an issue sits in a live editor. Offsets are within the text node. */
export interface SpellIssuePoint {
  key: string;
  offset: number;
}

export interface SpellIssue {
  /** Stable while the word stays in place — use it to target an issue. */
  id: string;
  /** The word exactly as written. */
  word: string;
  kind: SpellIssueKind;
  /** Human-readable explanation, in the plugin's locale. */
  message: string;
  /** Best first. Empty until looked up (see `suggestionsPending`). */
  suggestions: string[];
  /** `true` while dictionary suggestions are still being computed. */
  suggestionsPending: boolean;
  /** A slice of the surrounding sentence, for error listings. */
  context: string;
  /** Character offset of the word within its block's text. */
  blockOffset: number;
  /** Index of the block (paragraph, heading, list item…) in document order. */
  blockIndex: number;
  /** Live-editor location. Absent for headless checks. */
  anchor?: SpellIssuePoint;
  focus?: SpellIssuePoint;
}

export type SpellCheckStatus =
  /** Not run yet. */
  | "idle"
  /** The engine / dictionary is still loading. */
  | "loading"
  /** A check is in flight. */
  | "checking"
  /** Finished with no issues. */
  | "passed"
  /** Finished with at least one issue. */
  | "failed"
  /** The engine couldn't start or a check threw — see `error`. */
  | "error"
  /** The plugin is mounted with `enabled={false}`. */
  | "disabled";

export interface SpellCheckResult {
  status: SpellCheckStatus;
  /**
   * The one flag most integrations need: `true` only when a check
   * finished and found nothing. Loading, checking, error and disabled
   * are all `false` — never treat "not known yet" as a pass.
   */
  passed: boolean;
  issueCount: number;
  issues: SpellIssue[];
  /** Distinct words sent through the check. */
  checkedWordCount: number;
  /** `Date.now()` of the last finished check, or `null`. */
  checkedAt: number | null;
  error?: string;
}

export interface SpellAnalysisOptions {
  /**
   * Words always accepted — brand names, bylines, jargon. Compared
   * case-insensitively with Turkish casing rules (`I`/`ı`, `İ`/`i`).
   */
  ignoreWords?: string[];
  /**
   * Skip capitalised words the dictionary doesn't know when they are not
   * at the start of a sentence — almost always a name (`Kılıçdaroğlu`,
   * `Eglador'un`). Default `true`.
   */
  ignoreProperNouns?: boolean;
  /** Skip all-caps words the dictionary doesn't know (`TBMM`, `NATO`). Default `true`. */
  ignoreAllCaps?: boolean;
  /**
   * Extra wrong → right pairs, merged over the built-in Turkish list.
   * Keys are matched case-insensitively; map a key to `null` to switch a
   * built-in rule off.
   */
  commonMistakes?: Record<string, string | null>;
  /** Ignore words shorter than this. Default `2`. */
  minWordLength?: number;
}

export const EMPTY_SPELL_RESULT: SpellCheckResult = {
  status: "idle",
  passed: false,
  issueCount: 0,
  issues: [],
  checkedWordCount: 0,
  checkedAt: null,
};
