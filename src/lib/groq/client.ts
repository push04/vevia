import Groq from "groq-sdk";

import { requireEnv } from "../env";

export function createGroqClient() {
  return new Groq({ apiKey: requireEnv("GROQ_API_KEY") });
}

