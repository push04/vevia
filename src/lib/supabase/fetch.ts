const DEFAULT_TIMEOUT_MS = 8000;

function getTimeoutMs() {
  const raw = process.env.SUPABASE_HTTP_TIMEOUT_MS;
  if (!raw) return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TIMEOUT_MS;
  return Math.floor(parsed);
}

export async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const timeoutMs = getTimeoutMs();
  const controller = new AbortController();
  const existingSignal = init?.signal;

  const signal =
    typeof AbortSignal !== "undefined" && "any" in AbortSignal && existingSignal
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (AbortSignal as any).any([existingSignal, controller.signal])
      : controller.signal;

  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...(init ?? {}), signal });
  } finally {
    clearTimeout(timeout);
  }
}

