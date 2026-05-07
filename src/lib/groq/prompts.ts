export const RESUME_PARSE_PROMPT = `
You are an expert HR data extraction system.
Extract structured information from the following resume text.
Return ONLY valid JSON matching the schema below. No markdown, no explanation.

Schema:
{
  "full_name": string,
  "email": string | null,
  "phone": string | null,
  "current_location": string | null,
  "current_company": string | null,
  "current_title": string | null,
  "total_experience_years": number,
  "skills": string[],
  "education": [{
    "degree": string,
    "field": string,
    "institution": string,
    "year": number | null,
    "percentage_or_cgpa": string | null
  }],
  "work_experience": [{
    "company": string,
    "title": string,
    "start_date": string,
    "end_date": string | "Present",
    "duration_months": number,
    "key_responsibilities": string[],
    "technologies": string[]
  }],
  "certifications": string[],
  "languages": string[],
  "linkedin_url": string | null,
  "github_url": string | null,
  "portfolio_url": string | null,
  "summary": string
}
`;

export function screeningQuestionPrompt(params: {
  jobTitle: string;
  jobDescription: string;
  requiredSkills: string[];
  experienceRange: string;
  questionCount: number;
  language: "en" | "hi";
}) {
  const langHint =
    params.language === "hi"
      ? "Generate questions in simple Hindi (Devanagari), professional tone."
      : "Generate questions in English, professional tone.";

  return `
You are a senior recruiter creating a screening questionnaire for the Indian market.
${langHint}

Generate ${params.questionCount} smart screening questions for this role.

Job: ${params.jobTitle}
Experience Range: ${params.experienceRange}
Description: ${params.jobDescription.slice(0, 1500)}
Required Skills: ${params.requiredSkills.join(", ")}

For each question, provide:
- q: clear question text (mix of: availability, experience-proof, situational, motivation)
- type: 'yes_no' | 'short_text' | 'mcq' | 'number'
- weight: number (0.0 to 1.0)
- preferred_yes: boolean (only for yes_no)
- options: array of { id: string, title: string, ideal: boolean } (only for mcq, 2-4 options)
- why: 1-sentence explanation why this question matters

Return JSON only. Do not include markdown. Shape:
{ "questions": [ ... ] }
`;
}

export function answerScorePrompt(params: {
  jobContext: string;
  question: string;
  questionType: string;
  candidateAnswer: string;
  idealAnswer?: string;
}) {
  return `
You are evaluating a candidate's screening answer for a job in India.
Score this answer from 0 to 10 and optionally suggest a follow-up question.

Job Context: ${params.jobContext}
Question Type: ${params.questionType}
Question: ${params.question}
Candidate's Answer: ${params.candidateAnswer}
${params.idealAnswer ? `Ideal Answer Direction: ${params.idealAnswer}` : ""}

Return JSON only:
{ "score": number, "reasoning": string, "follow_up": string|null }

Scoring guide:
- 9-10: Excellent, specific, demonstrates clear expertise
- 7-8: Good, relevant, shows understanding
- 5-6: Adequate, partially answers the question
- 3-4: Weak, vague or partially irrelevant
- 0-2: No answer, completely off-topic, or disqualifying
`;
}

export function scoreExplanationPrompt(params: {
  jobTitle: string;
  jobDescription: string;
  candidateSummary: string;
  scores: Record<string, unknown>;
}) {
  return `
You are an explainability layer for an AI hiring scorecard.
Write a concise explanation (max 6 bullet points) for a recruiter in India.

Job: ${params.jobTitle}
JD Summary: ${params.jobDescription.slice(0, 600)}
Candidate Summary: ${params.candidateSummary.slice(0, 600)}

Scores JSON:
${JSON.stringify(params.scores)}

Return JSON only:
{ "summary": string, "bullets": string[] }
`;
}
