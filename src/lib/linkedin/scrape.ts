export async function scrapeLinkedInProfile(url: string): Promise<string | null> {
  const normalized = url.replace(/\/$/, "");

  // Try Google cache first (LinkedIn blocks headless requests)
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(normalized)}&strip=1&vwsrc=0`;
  const cached = await attemptFetch(cacheUrl);
  if (cached) {
    const extracted = extractLinkedInText(cached, true);
    if (extracted) return extracted;
  }

  // Fallback: try direct fetch (usually fails with 999)
  const direct = await attemptFetch(normalized);
  if (direct) {
    const extracted = extractLinkedInText(direct, false);
    if (extracted) return extracted;
  }

  return null;
}

async function attemptFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function extractLinkedInText(html: string, isGoogleCache: boolean): string | null {
  const sections: string[] = [];

  // Try JSON-LD structured data
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

  // Look for LinkedIn's embedded profile data in window.__INITIAL_STATE__ or similar
  const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
  if (stateMatch) {
    try {
      const state = JSON.parse(stateMatch[1]);
      const profile = state?.entities?.profile ?? state?.profile ?? state?.data?.profile ?? {};
      const text = flattenProfileData(profile);
      if (text) return text;
    } catch {}
  }

  // Strip HTML and extract meaningful text
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

function flattenProfileData(obj: Record<string, unknown>, depth = 0): string | null {
  if (depth > 5) return null;
  const parts: string[] = [];
  const keys = ["firstName", "lastName", "headline", "summary", "companyName", "title", "schoolName", "degreeName", "skill"];
  for (const key of keys) {
    const val = obj[key];
    if (val && typeof val === "string") parts.push(`${key}: ${val}`);
  }
  // Recurse into nested objects
  for (const val of Object.values(obj)) {
    if (val && typeof val === "object") {
      const nested = flattenProfileData(val as Record<string, unknown>, depth + 1);
      if (nested) parts.push(nested);
    }
  }
  return parts.length > 0 ? parts.join("\n") : null;
}

function extractJsonLd(data: unknown, sections: string[]): void {
  if (!data || typeof data !== "object") return;

  const obj = data as Record<string, unknown>;

  if (obj.name && typeof obj.name === "string") sections.push(`Name: ${obj.name}`);
  if (obj.description && typeof obj.description === "string") sections.push(`Headline: ${obj.description}`);
  if (obj.jobTitle && typeof obj.jobTitle === "string") sections.push(`Title: ${obj.jobTitle}`);

  for (const key of ["hasOccupation", "worksFor", "alumniOf", "knowsAbout", "skills", "itemListElement"]) {
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) extractJsonLd(item, sections);
    } else if (val && typeof val === "object") {
      extractJsonLd(val, sections);
    }
  }
}
