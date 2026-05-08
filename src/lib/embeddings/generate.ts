const DIMENSIONS = 384;
const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
const EMBEDDING_TIMEOUT_MS = 5_000;

type Extractor = (input: string | string[], options?: unknown) => Promise<{
  dims?: number[];
  data?: Float32Array;
  tolist?: () => unknown;
}>;

let extractorPromise: Promise<Extractor> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Embedding timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function getExtractor(): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { env, pipeline } = await import("@xenova/transformers");

      env.cacheDir = process.env.TRANSFORMERS_CACHE_DIR ?? "/tmp/transformers-cache";

      const extractor = (await pipeline("feature-extraction", MODEL_ID)) as Extractor;
      return extractor;
    })();
  }
  return extractorPromise;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  if (process.env.NEXT_RUNTIME === "edge") {
    throw new Error("Embeddings require the Node.js runtime.");
  }

  const clean = text.replace(/\s+/g, " ").trim().slice(0, 8000);
  if (!clean) return new Array<number>(DIMENSIONS).fill(0);

  const extractor = await withTimeout(getExtractor(), EMBEDDING_TIMEOUT_MS);
  const output = await extractor(clean, { pooling: "mean", normalize: true });

  const data = output.data;
  if (!data || data.length !== DIMENSIONS) {
    throw new Error(`Unexpected embedding shape (expected ${DIMENSIONS} dims).`);
  }

  return Array.from(data);
}
