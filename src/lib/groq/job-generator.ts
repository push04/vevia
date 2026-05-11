import { createGroqClient, withRetry } from "./client";
import { requireEnv } from "../env";

export interface GeneratedJobDetails {
  description: string;
  requirements: string[];
}

export async function generateJobDetails(title: string): Promise<GeneratedJobDetails> {
  requireEnv("GROQ_API_KEY");
  const groq = createGroqClient();

  const result = await withRetry(() =>
    groq.chat.completions.create({
      model: process.env.GROQ_MODEL_LARGE ?? "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert talent acquisition specialist for a modern Indian technology company. You write compelling, precise, and professional job descriptions that attract top-tier candidates. Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: `Write a professional job posting for the role: "${title}"

Return a JSON object with exactly these two fields:
- "description": A 2-3 paragraph compelling job description covering the role overview, key responsibilities, and what makes this role exciting. Keep it concise (max 300 words).
- "requirements": An array of exactly 6 clear, specific requirements (strings, each max 80 chars).

Respond with ONLY the JSON object, no markdown, no explanation.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  );

  const raw = result.choices[0]?.message?.content ?? "{}";
  
  try {
    const parsed = JSON.parse(raw.trim()) as GeneratedJobDetails;
    return {
      description: parsed.description ?? "",
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
    };
  } catch {
    // Fallback: try to extract JSON from markdown code block
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
    if (match) {
      const parsed = JSON.parse(match[1]) as GeneratedJobDetails;
      return {
        description: parsed.description ?? "",
        requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      };
    }
    throw new Error("AI returned an unparseable response. Please try again.");
  }
}
