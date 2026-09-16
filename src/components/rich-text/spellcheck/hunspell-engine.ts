/**
 * The Hunspell core, independent of where it runs. The Web Worker entry
 * (`spell-worker.ts`) and the main-thread fallback both build on this,
 * so they can't drift apart.
 */

export interface HunspellEngine {
  check(words: string[]): boolean[];
  suggest(word: string): string[];
  addWord(word: string): void;
  dispose(): void;
}

export type DictionaryData = ArrayBuffer | Uint8Array | string;

const toBytes = (data: DictionaryData): Uint8Array =>
  typeof data === "string"
    ? new TextEncoder().encode(data)
    : data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

type LoadHunspell = typeof import("hunspell-asm").loadModule;

export async function createHunspellEngine(
  loadModule: LoadHunspell,
  aff: DictionaryData,
  dic: DictionaryData,
  words: string[] = [],
): Promise<HunspellEngine> {
  const factory = await loadModule();
  const affPath = factory.mountBuffer(toBytes(aff), "dictionary.aff");
  const dicPath = factory.mountBuffer(toBytes(dic), "dictionary.dic");
  const hunspell = factory.create(affPath, dicPath);
  for (const word of words) hunspell.addWord(word);

  return {
    check: (list) => list.map((word) => hunspell.spell(word)),
    suggest: (word) => hunspell.suggest(word),
    addWord: (word) => hunspell.addWord(word),
    dispose: () => {
      hunspell.dispose();
      factory.unmount(affPath);
      factory.unmount(dicPath);
    },
  };
}

/** Fetch a dictionary pair; shared by the worker and the main thread. */
export async function fetchDictionary(urls: {
  aff: string;
  dic: string;
}): Promise<{ aff: ArrayBuffer; dic: ArrayBuffer }> {
  const get = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Dictionary download failed (${res.status}): ${url}`);
    return res.arrayBuffer();
  };
  const [aff, dic] = await Promise.all([get(urls.aff), get(urls.dic)]);
  return { aff, dic };
}

// ── worker protocol ───────────────────────────────────────────────────

export type SpellWorkerRequest =
  | {
      id: number;
      type: "init";
      urls?: { aff: string; dic: string };
      aff?: ArrayBuffer;
      dic?: ArrayBuffer;
      words: string[];
    }
  | { id: number; type: "check"; words: string[] }
  | { id: number; type: "suggest"; word: string }
  | { id: number; type: "add"; word: string };

export type SpellWorkerResponse =
  | { id: number; ok: true; value: unknown }
  | { id: number; ok: false; error: string };
