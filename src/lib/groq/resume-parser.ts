import { z } from "zod";

import { requireEnv } from "../env";
import { createGroqClient, withRetry } from "./client";
import { RESUME_PARSE_PROMPT } from "./prompts";

const ResumeSchema = z.object({
  full_name: z.string().catch(""),
  email: z.string().nullable().catch(""),
  phone: z.string().nullable().catch(""),
  current_location: z.string().nullable().catch(""),
  current_company: z.string().nullable().catch(""),
  current_title: z.string().nullable().catch(""),
  total_experience_years: z.number().catch(0),
  skills: z.array(z.string()).catch([]),
  education: z.array(
    z.object({
      degree: z.string().catch(""),
      field: z.string().catch(""),
      institution: z.string().catch(""),
      year: z.number().nullable().catch(0),
      percentage_or_cgpa: z.string().nullable().catch(""),
    }),
  ),
  work_experience: z.array(
    z.object({
      company: z.string().nullable().default("").catch(""),
      title: z.string().nullable().default("").catch(""),
      start_date: z.string().nullable().default("").catch(""),
      end_date: z
        .union([z.string(), z.literal("Present")])
        .nullable()
        .default("")
        .catch(""),
      duration_months: z.number().nullable().default(0).catch(0),
      key_responsibilities: z.array(z.string()).default([]).catch([]),
      technologies: z.array(z.string()).default([]).catch([]),
    }),
  ),
  certifications: z.array(z.string()).catch([]),
  languages: z.array(z.string()).catch([]),
  linkedin_url: z.string().nullable().catch(""),
  github_url: z.string().nullable().catch(""),
  portfolio_url: z.string().nullable().catch(""),
  summary: z.string().catch(""),
});

export type ParsedResume = z.infer<typeof ResumeSchema>;

export async function parseResume(rawText: string): Promise<ParsedResume> {
  const groq = createGroqClient();
  const model = requireEnv("GROQ_MODEL_LARGE");

  const completion = await withRetry(() =>
    groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: RESUME_PARSE_PROMPT },
        { role: "user", content: `Resume text:\n\n${rawText.slice(0, 8000)}` },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }),
  );

  const content = completion.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty content");

  const parsed = JSON.parse(content);
  return ResumeSchema.parse(parsed);
}
