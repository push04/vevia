import Groq from "groq-sdk";

import { requireEnv } from "../env";

export function createGroqClient() {
  return new Groq({ apiKey: requireEnv("GROQ_API_KEY") });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 500) return false;
  }
  return true;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error)) throw error;
      if (attempt < maxRetries) {
        await sleep(baseDelay * Math.pow(2, attempt));
      }
    }
  }
  throw lastError;
}

