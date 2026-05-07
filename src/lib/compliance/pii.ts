const PROHIBITED_QUESTION_TOPICS = [
  "marital status",
  "children",
  "family planning",
  "pregnancy",
  "religion",
  "caste",
  "native place",
  "disability status",
  "political affiliation",
  "salary history",
] as const;

export function containsProhibitedTopic(question: string): boolean {
  const lower = question.toLowerCase();
  return PROHIBITED_QUESTION_TOPICS.some((topic) => lower.includes(topic));
}

