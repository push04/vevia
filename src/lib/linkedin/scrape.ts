export async function scrapeLinkedInProfile(url: string): Promise<string | null> {
  try {
    const normalized = url.replace(/\/$/, "");
    const response = await fetch(normalized, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;
    const html = await response.text();
    return extractLinkedInText(html);
  } catch {
    return null;
  }
}

function extractLinkedInText(html: string): string | null {
  const sections: string[] = [];

  // Try JSON-LD structured data (most reliable)
  const scriptRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1].trim());
      extractJsonLd(data, sections);
    } catch {
      // skip invalid JSON
    }
  }

  if (sections.length > 0) return sections.join("\n").slice(0, 3000);

  // Fallback: plain text extraction
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const line of text.split(/[.\n]+/)) {
    const t = line.trim();
    if (t.length > 30 && /experience|education|skill|work|employ|engineer|manager|developer|student/i.test(t)) {
      sections.push(t);
    }
  }

  return sections.length > 0 ? sections.join("\n").slice(0, 3000) : null;
}

function extractJsonLd(data: unknown, sections: string[]): void {
  if (!data || typeof data !== "object") return;

  const obj = data as Record<string, unknown>;

  if (obj.name && typeof obj.name === "string") sections.push(`Name: ${obj.name}`);
  if (obj.description && typeof obj.description === "string") sections.push(`Headline: ${obj.description}`);
  if (obj.jobTitle && typeof obj.jobTitle === "string") sections.push(`Title: ${obj.jobTitle}`);

  // Nested objects or arrays
  for (const key of ["hasOccupation", "worksFor", "alumniOf", "knowsAbout", "skills"]) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) extractJsonLd(item, sections);
    } else if (val && typeof val === "object") {
      extractJsonLd(val, sections);
    }
  }
}
