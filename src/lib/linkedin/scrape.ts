const GLOBAL_TIMEOUT = 7000;
const MAX_CONCURRENT = 6;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:126.0) Gecko/20100101 Firefox/126.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.72 Mobile Safari/537.36",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.179 Mobile Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function browserHeaders(): Record<string, string> {
  const ua = randomUA();
  const isMobile = ua.includes("iPhone") || ua.includes("Android") || ua.includes("Mobile");
  return {
    "User-Agent": ua,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Ch-Ua": `"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"`,
    "Sec-Ch-Ua-Mobile": isMobile ? "?1" : "?0",
    "Sec-Ch-Ua-Platform": isMobile ? '"Android"' : '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    Referer: "https://www.google.com/",
    Connection: "keep-alive",
  };
}

export async function scrapeLinkedInProfile(url: string): Promise<string | null> {
  const normalized = url.replace(/\/$/, "");
  const username = extractUsername(normalized);
  if (!username || username === "unknown") return null;

  const results = await Promise.race([
    runAllStrategies(normalized, username),
    timeout(GLOBAL_TIMEOUT),
  ]);

  if (results && typeof results === "string") {
    return results;
  }

  return `LinkedIn Profile: ${username}`;
}

async function runAllStrategies(url: string, username: string): Promise<string | null> {
  const strategies: (() => Promise<string | null>)[] = [
    () => tryJinaReader(url),
    () => tryDirectFetch(url),
    () => tryGoogleCache(url),
    () => tryJinaOnGoogleCache(url),
    () => tryMobileLite(url),
    () => tryCorsProxy(url),
    () => tryLinkedInDetailsAPI(url),
    () => tryBingCache(url),
    () => tryTextise(url),
    () => tryWebArchive(url),
  ];

  const chunks: (() => Promise<string | null>)[][] = [];
  for (let i = 0; i < strategies.length; i += MAX_CONCURRENT) {
    chunks.push(strategies.slice(i, i + MAX_CONCURRENT));
  }

  for (const chunk of chunks) {
    const result = await Promise.race([
      ...chunk.map((s) => s()),
      timeout(5000),
    ]);
    if (result && typeof result === "string" && result.length > 50) {
      return `LinkedIn Profile: ${username}\n${result}`;
    }
  }

  return null;
}

function timeout(ms: number): Promise<null> {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

function extractUsername(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1].replace(/-/g, " ")) : "unknown";
}

async function tryJinaReader(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 + attempt * 1500));
      const response = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          Accept: "text/plain",
          "User-Agent": randomUA(),
          "X-Return-Format": "markdown",
        },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const text = await response.text();
      if (!text || text.includes("error 429") || text.includes("error 999") || text.includes("Sign Up | LinkedIn") || text.includes("Join LinkedIn")) continue;
      const mdMatch = text.match(/Markdown Content:\s*\n([\s\S]*)/);
      if (!mdMatch) continue;
      const content = mdMatch[1].trim();
      const relevant = extractRelevantSections(content);
      if (relevant) return relevant;
    } catch {
      continue;
    }
  }
  return null;
}

async function tryDirectFetch(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: browserHeaders(),
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes("Sign Up") && html.includes("Join LinkedIn")) return null;
    if (html.includes("999") || html.length < 500) return null;
    return extractPlainText(html);
  } catch {
    return null;
  }
}

async function tryGoogleCache(url: string): Promise<string | null> {
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&strip=1&vwsrc=0`;
    const response = await fetch(cacheUrl, {
      headers: {
        "User-Agent": randomUA(),
        Accept: "text/html,*/*",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const text = extractPlainText(html);
    if (!text || text.length < 30) return null;
    if (text.includes("This is the Google cache") || hasProfileContent(text)) return text;
    return null;
  } catch {
    return null;
  }
}

async function tryJinaOnGoogleCache(url: string): Promise<string | null> {
  try {
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&strip=1&vwsrc=0`;
    const jinaUrl = `https://r.jina.ai/${cacheUrl}`;
    const response = await fetch(jinaUrl, {
      headers: { Accept: "text/plain", "User-Agent": randomUA() },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const text = await response.text();
    const mdMatch = text.match(/Markdown Content:\s*\n([\s\S]*)/);
    if (!mdMatch) return null;
    const content = mdMatch[1].trim();
    const relevant = extractRelevantSections(content);
    if (relevant) return relevant;
    return content.length > 50 ? content.slice(0, 3000) : null;
  } catch {
    return null;
  }
}

async function tryMobileLite(url: string): Promise<string | null> {
  const username = extractUsername(url);
  if (!username || username === "unknown") return null;
  const encodedName = encodeURIComponent(username.replace(/ /g, "-").toLowerCase());

  const mobileUrls = [
    `https://www.linkedin.com/mwlite/in/${encodedName}`,
    `https://www.linkedin.com/mwlite/in/${encodedName}/`,
  ];

  for (const mobileUrl of mobileUrls) {
    try {
      const response = await fetch(mobileUrl, {
        headers: {
          ...browserHeaders(),
          "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.179 Mobile Safari/537.36",
        },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (html.includes("Sign Up") || html.includes("999") || html.length < 300) continue;
      return extractPlainText(html);
    } catch {
      continue;
    }
  }
  return null;
}

async function tryCorsProxy(url: string): Promise<string | null> {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
    (u: string) => `https://api.proxyscrape.com/v2/?request=get&url=${encodeURIComponent(u)}&timeout=5000`,
    (u: string) => `https://proxy.raventools.com/?url=${encodeURIComponent(u)}`,
  ];

  for (const buildUrl of proxies) {
    try {
      const proxyUrl = buildUrl(url);
      const response = await fetch(proxyUrl, {
        headers: {
          "User-Agent": randomUA(),
          Accept: "text/html,*/*",
        },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (!html || html.includes("999") || html.length < 300 || html.includes("Sign Up")) continue;
      const text = extractPlainText(html);
      if (text && text.length > 30) return text;
    } catch {
      continue;
    }
  }
  return null;
}

async function tryLinkedInDetailsAPI(url: string): Promise<string | null> {
  const username = extractUsername(url);
  if (!username || username === "unknown") return null;
  const encodedName = encodeURIComponent(username.replace(/ /g, "-").toLowerCase());

  const apiEndpoints = [
    `https://www.linkedin.com/in/${encodedName}/details/experience/`,
    `https://www.linkedin.com/in/${encodedName}/details/education/`,
    `https://www.linkedin.com/in/${encodedName}/details/skills/`,
    `https://www.linkedin.com/in/${encodedName}/overlay/contact-info/`,
  ];

  const results: string[] = [];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: browserHeaders(),
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) continue;
      const html = await response.text();
      if (html.length < 200 || html.includes("999")) continue;
      const text = extractPlainText(html);
      if (text && text.length > 20) results.push(text);
    } catch {
      continue;
    }
  }

  return results.length > 0 ? results.join("\n").slice(0, 4000) : null;
}

async function tryBingCache(url: string): Promise<string | null> {
  try {
    const bingSearchUrl = `https://www.bing.com/search?q=cache%3A${encodeURIComponent(url)}`;
    const response = await fetch(bingSearchUrl, {
      headers: {
        "User-Agent": randomUA(),
        Accept: "text/html,*/*",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes("There are no results") || html.length < 500) return null;
    const text = extractPlainText(html);
    if (text && text.length > 30 && hasProfileContent(text)) return text;
    return null;
  } catch {
    return null;
  }
}

async function tryTextise(url: string): Promise<string | null> {
  const textisers = [
    `https://r.jina.ai/https://r.jina.ai/${url}`,
    `https://r.jina.ai/https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`,
  ];

  for (const textiseUrl of textisers) {
    try {
      const response = await fetch(textiseUrl, {
        headers: { Accept: "text/plain", "User-Agent": randomUA() },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) continue;
      const text = await response.text();
      const mdMatch = text.match(/Markdown Content:\s*\n([\s\S]*)/);
      if (!mdMatch) continue;
      const content = mdMatch[1].trim();
      const relevant = extractRelevantSections(content);
      if (relevant) return relevant;
    } catch {
      continue;
    }
  }
  return null;
}

async function tryWebArchive(url: string): Promise<string | null> {
  const username = extractUsername(url);
  if (!username || username === "unknown") return null;
  const encodedName = encodeURIComponent(username.replace(/ /g, "-").toLowerCase());
  const linkedinUrl = `https://www.linkedin.com/in/${encodedName}/`;

  try {
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(linkedinUrl)}&output=json&limit=5&fl=timestamp,original&filter=statuscode:200`;
    const cdxResponse = await fetch(cdxUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (!cdxResponse.ok) return null;
    const cdxData = await cdxResponse.json();
    if (!Array.isArray(cdxData) || cdxData.length < 2) return null;
    const snapshot = cdxData[1];
    if (!Array.isArray(snapshot) || snapshot.length < 1) return null;
    const timestamp = snapshot[0];
    const archiveUrl = `https://web.archive.org/web/${timestamp}/${linkedinUrl}`;
    const response = await fetch(archiveUrl, {
      headers: { "User-Agent": randomUA(), Accept: "text/html,*/*" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    if (html.includes("Wayback Machine") && html.includes("Not Found")) return null;
    return extractPlainText(html);
  } catch {
    return null;
  }
}

function hasProfileContent(text: string): boolean {
  const profileIndicators = /experience|education|skill|employ|engineer|developer|manager|student/i;
  const nameIndicator = /linkedin/i;
  return profileIndicators.test(text) || nameIndicator.test(text);
}

function extractRelevantSections(text: string): string | null {
  const lines: string[] = [];
  const keywords = /experience|education|skill|work|employ|engineer|manager|developer|student|technolog|project|intern|university|college|b\.tech|m\.tech|bachelor|master|react|node|python|java|type|javascript|full.?stack|frontend|backend|devops|cloud|aws|sql|mongo|docker|kubernet|tensorflow|pytorch|machine.?learn|deep.?learn|artificial|data.?scien|analytics|agile|scrum|leadership|managing/i;

  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t.length > 15 && keywords.test(t)) {
      lines.push(t);
    }
  }

  return lines.length > 0 ? lines.join("\n").slice(0, 4000) : null;
}

function extractPlainText(html: string): string | null {
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lines = text.split(/[.\n]+/);
  const relevant = lines.filter((l) => {
    const t = l.trim();
    return t.length > 25 && /experience|education|skill|work|employ|engineer|manager|developer|student|technolog|project|intern|university/i.test(t);
  });

  return relevant.length > 0 ? relevant.join("\n").slice(0, 3000) : null;
}
