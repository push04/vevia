// LinkedIn blocks headless requests (HTTP 999) and profiles are JS-rendered,
// so direct scraping from Vercel serverless is not feasible without a paid API
// (e.g. Proxycurl, Scrapin.io). This module does best-effort attempts and
// silently fails. The LinkedIn URL is always saved on the candidate record
// regardless of scrape success.

export async function scrapeLinkedInProfile(url: string): Promise<string | null> {
  // Attempt 1: Google cache (sometimes has cached text for public profiles)
  const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url.replace(/\/$/, ""))}&strip=1&vwsrc=0`;
  const cached = await attemptFetch(cacheUrl);
  if (cached) {
    const extracted = extractPlainText(cached);
    if (extracted) return extracted;
  }

  // Attempt 2: Direct fetch (usually returns 999)
  const direct = await attemptFetch(url);
  if (direct) {
    const extracted = extractPlainText(direct);
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

function extractPlainText(html: string): string | null {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lines = text.split(/[.\n]+/);
  const relevant = lines.filter((l) => {
    const t = l.trim();
    return (
      t.length > 25 &&
      /experience|education|skill|work|employ|engineer|manager|developer|student|technolog|project|intern/i.test(t)
    );
  });

  return relevant.length > 0 ? relevant.join("\n").slice(0, 3000) : null;
}
