import { z } from "zod";

import { requireEnv } from "../env";
import { createGroqClient } from "./client";
import { RESUME_PARSE_PROMPT } from "./prompts";

const ResumeSchema = z.object({
  full_name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  current_location: z.string().nullable(),
  current_company: z.string().nullable(),
  current_title: z.string().nullable(),
  total_experience_years: z.number(),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      degree: z.string(),
      field: z.string(),
      institution: z.string(),
      year: z.number().nullable(),
      percentage_or_cgpa: z.string().nullable(),
    }),
  ),
  work_experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      start_date: z.string(),
      end_date: z.union([z.string(), z.literal("Present")]),
      duration_months: z.number(),
      key_responsibilities: z.array(z.string()),
      technologies: z.array(z.string()),
    }),
  ),
  certifications: z.array(z.string()),
  languages: z.array(z.string()),
  linkedin_url: z.string().nullable(),
  github_url: z.string().nullable(),
  portfolio_url: z.string().nullable(),
  summary: z.string(),
});

export type ParsedResume = z.infer<typeof ResumeSchema>;

export async function parseResume(rawText: string): Promise<ParsedResume> {
  const groq = createGroqClient();
  const model = requireEnv("GROQ_MODEL_LARGE");

  const completion = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: RESUME_PARSE_PROMPT },
      { role: "user", content: `Resume text:\n\n${rawText.slice(0, 8000)}` },
    ],
    temperature: 0.1,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  const parsed = JSON.parse(content);
  return ResumeSchema.parse(parsed);
}
