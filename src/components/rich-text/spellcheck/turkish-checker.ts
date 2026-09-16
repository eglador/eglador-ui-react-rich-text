import {
  createHunspellEngine,
  fetchDictionary,
  type DictionaryData,
  type HunspellEngine,
  type SpellWorkerRequest,
  type SpellWorkerResponse,
} from "./hunspell-engine";
import type { SpellChecker } from "./types";

/**
 * Default dictionary: `dictionary-tr` (MIT, Hunspell format, ~9 MB `.dic`)
 * served from jsDelivr. Only dictionary *data* is fetched — the text being
 * checked never leaves the browser. Self-host both files and pass
 * `dictionaryUrls` to avoid the CDN.
 */
export const TURKISH_DICTIONARY_URLS = {
  aff: "https://cdn.jsdelivr.net/npm/dictionary-tr@2.0.0/index.aff",
  dic: "https://cdn.jsdelivr.net/npm/dictionary-tr@2.0.0/index.dic",
} as const;

export interface TurkishSpellCheckerOptions {
  /** Where to download the Hunspell `.aff` / `.dic` pair from. */
  dictionaryUrls?: { aff: string; dic: string };
  /**
   * Supply the dictionary yourself instead of downloading it — e.g. read
   * it from disk on a server: `() => ({ aff: fs.readFileSync(...), ... })`.
   */
  loadDictionary?: () =>
    | Promise<{ aff: DictionaryData; dic: DictionaryData }>
    | { aff: DictionaryData; dic: DictionaryData };
  /** Words accepted from the start (brand names, bylines…). */
  words?: string[];
  /**
   * Run Hunspell in a Web Worker (default: whenever `Worker` exists).
   * The loaded dictionary takes ~45 MB — keep it off the UI thread.
   * Without a worker the engine loads in-process, which is meant for
   * servers and tests.
   */
  worker?: boolean;
}

/** Hide the specifier from bundlers: the in-process path is for Node,
 *  and hunspell-asm's ESM build doesn't survive bundling anyway. */
const importHunspell = (): Promise<typeof import("hunspell-asm")> => {
  const specifier = "hunspell-asm";
  return import(/* webpackIgnore: true */ /* @vite-ignore */ specifier);
};

class WorkerTransport {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();

  constructor(source: string) {
    const url = URL.createObjectURL(
      new Blob([source], { type: "text/javascript" }),
    );
    this.worker = new Worker(url);
    // The worker has its own copy of the script once started.
    URL.revokeObjectURL(url);

    this.worker.onmessage = ({ data }: MessageEvent<SpellWorkerResponse>) => {
      const entry = this.pending.get(data.id);
      if (!entry) return;
      this.pending.delete(data.id);
      if (data.ok) entry.resolve(data.value);
      else entry.reject(new Error(data.error));
    };
    this.worker.onerror = (event) => {
      const error = new Error(event.message || "Spell-check worker failed");
      for (const entry of this.pending.values()) entry.reject(error);
      this.pending.clear();
    };
  }

  request<T>(
    message: DistributiveOmit<SpellWorkerRequest, "id">,
    transfer: Transferable[] = [],
  ): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.worker.postMessage({ ...message, id }, transfer);
    });
  }

  terminate() {
    this.worker.terminate();
    const error = new Error("Spell checker disposed");
    for (const entry of this.pending.values()) entry.reject(error);
    this.pending.clear();
  }
}

type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;

const toArrayBuffer = (data: DictionaryData): ArrayBuffer => {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer as ArrayBuffer;
  }
  if (data instanceof Uint8Array) {
    // Copy: the slice may be a view into a larger (or shared) buffer.
    return data.slice().buffer as ArrayBuffer;
  }
  return data;
};

/**
 * Hunspell with a Turkish dictionary, lazily started: nothing downloads
 * until the first `ready()` / `check()`. A failed start (offline, CDN
 * blocked) rejects that call and is retried on the next one.
 */
export function createTurkishSpellChecker(
  options: TurkishSpellCheckerOptions = {},
): SpellChecker {
  const useWorker = options.worker ?? typeof Worker !== "undefined";
  // A Blob worker's base URL is `blob:…`, so `/dictionaries/tr.aff`
  // would not resolve inside it — anchor relative paths to the page.
  const absolute = (url: string) =>
    typeof location === "undefined" ? url : new URL(url, location.href).href;
  const given = options.dictionaryUrls ?? TURKISH_DICTIONARY_URLS;
  const urls = { aff: absolute(given.aff), dic: absolute(given.dic) };
  const words = options.words ?? [];

  let transport: WorkerTransport | null = null;
  let local: HunspellEngine | null = null;
  let starting: Promise<void> | null = null;
  let disposed = false;

  const start = async () => {
    if (useWorker) {
      const { SPELL_WORKER_SOURCE } = await import("./worker-source.generated");
      transport ??= new WorkerTransport(SPELL_WORKER_SOURCE);
      if (options.loadDictionary) {
        const dict = await options.loadDictionary();
        const aff = toArrayBuffer(dict.aff);
        const dic = toArrayBuffer(dict.dic);
        await transport.request({ type: "init", aff, dic, words }, [aff, dic]);
      } else {
        await transport.request({ type: "init", urls, words });
      }
      return;
    }

    const dict = options.loadDictionary
      ? await options.loadDictionary()
      : await fetchDictionary(urls);
    const { loadModule } = await importHunspell();
    local = await createHunspellEngine(loadModule, dict.aff, dict.dic, words);
  };

  const ready = () => {
    if (disposed) return Promise.reject(new Error("Spell checker disposed"));
    starting ??= start().catch((error) => {
      starting = null;
      throw error;
    });
    return starting;
  };

  return {
    ready,

    async check(list) {
      await ready();
      if (list.length === 0) return [];
      return transport
        ? transport.request<boolean[]>({ type: "check", words: list })
        : local!.check(list);
    },

    async suggest(word) {
      await ready();
      return transport
        ? transport.request<string[]>({ type: "suggest", word })
        : local!.suggest(word);
    },

    async addWord(word) {
      await ready();
      if (transport) await transport.request({ type: "add", word });
      else local!.addWord(word);
    },

    dispose() {
      disposed = true;
      transport?.terminate();
      local?.dispose();
      transport = null;
      local = null;
    },
  };
}

let shared: SpellChecker | null = null;

/**
 * One Turkish checker for the whole page, so several editors share a
 * single worker and a single copy of the dictionary.
 */
export function getSharedTurkishSpellChecker(): SpellChecker {
  shared ??= createTurkishSpellChecker();
  return shared;
}
