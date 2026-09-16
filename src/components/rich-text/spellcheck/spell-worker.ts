/**
 * Web Worker entry. Not imported by the library directly — bundled on its
 * own by `scripts/build-spell-worker.mjs` into an inline source string, so
 * hosts never have to configure a worker URL in their bundler.
 */
import { loadModule } from "hunspell-asm";
import {
  createHunspellEngine,
  fetchDictionary,
  type HunspellEngine,
  type SpellWorkerRequest,
  type SpellWorkerResponse,
} from "./hunspell-engine";

interface WorkerScope {
  onmessage: ((event: MessageEvent<SpellWorkerRequest>) => void) | null;
  postMessage(message: SpellWorkerResponse): void;
}
const scope = self as unknown as WorkerScope;

let engine: Promise<HunspellEngine> | null = null;

const requireEngine = () => {
  if (!engine) throw new Error("Spell worker used before init");
  return engine;
};

scope.onmessage = async ({ data }) => {
  try {
    let value: unknown = null;
    switch (data.type) {
      case "init": {
        engine ??= (async () => {
          const dict =
            data.aff && data.dic
              ? { aff: data.aff, dic: data.dic }
              : await fetchDictionary(data.urls!);
          return createHunspellEngine(loadModule, dict.aff, dict.dic, data.words);
        })();
        await engine;
        break;
      }
      case "check":
        value = (await requireEngine()).check(data.words);
        break;
      case "suggest":
        value = (await requireEngine()).suggest(data.word);
        break;
      case "add":
        (await requireEngine()).addWord(data.word);
        break;
    }
    scope.postMessage({ id: data.id, ok: true, value });
  } catch (error) {
    // A failed init must be retryable, not cached forever.
    if (data.type === "init") engine = null;
    scope.postMessage({
      id: data.id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
